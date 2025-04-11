import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/libs/entities/user.entity';
import { ErrorHelper } from 'src/libs/helper/error.helper';
import { FormatResponseHelper } from 'src/libs/helper/response.helper';
import { DataSource, Repository } from 'typeorm';
import { LoginAppDto, LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import { createHash } from 'crypto';
import { Role } from 'src/libs/entities/role.entity';
import { IAccess, IJwtPayload } from 'src/libs/interface';
import { CACHE_PREFIX, DEFAULT_CONFIG, REDIS_TTL } from 'src/libs/constant';
import { addMinutes } from 'date-fns';
import { hashPassword } from 'src/libs/helper/common.helper';
import { MailService } from 'src/libs/service/mail/mail.service';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly repository: Repository<User>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly dataSource: DataSource,
    private readonly error: ErrorHelper,
    private readonly res: FormatResponseHelper,
  ) {}

  async loginApp(payload: LoginAppDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const SELECTED_COLUMNS = [
        'u.id',
        'u.email',
        'u.password',
        'u.is_admin',
        'e.id as employee_id',
        'e.name as employee_name',
        'd.name as department_name',
        'b.name as branch_name',
        'r.name as role_name',
        'r.id as role_id',
      ];

      const [data] = await queryRunner.query(
        `SELECT ${SELECTED_COLUMNS.join(', ')}
         FROM users u 
         LEFT JOIN employees e ON e.id_user = u.id
         LEFT JOIN departments d ON d.id = e.id_department
         LEFT JOIN branches b ON b.id = e.id_branch
         LEFT JOIN roles r ON r.id = u.role_id
         WHERE u.email = $1
         LIMIT 1`,
        [payload.email],
      );

      if (!data)
        throw new UnauthorizedException('Email atau Password anda salah');

      const isValidPassword = await bcrypt.compare(
        payload.password,
        data.password,
      );

      if (!isValidPassword)
        throw new UnauthorizedException('Email atau Password anda salah');

      if (data.is_admin)
        throw new UnauthorizedException('Akun anda tidak memiliki akses');

      if (payload.token_notif) {
        // set token_notif to employee
        await queryRunner.query(
          `UPDATE employees
        SET token_notif = $1
        WHERE id = $2`,
          [payload.token_notif, data.employee_id],
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [accessToken] = await Promise.all([
        this.jwtService.signAsync({
          id: data.id,
          name: data.name,
          email: data.email,
          roleId: data['role_id'],
          roleName: data['role_name'],
        }),
        queryRunner.manager.update(User, data.id, {
          last_login: new Date(),
        }),
      ]);

      await queryRunner.commitTransaction();

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: {
          ...data,
          password: undefined,
          accessToken,
        },
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(
        error,
        `${AuthService.name}.${this.loginApp.name}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async login(payload: LoginDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const [user] = (await queryRunner.manager.query(
        `SELECT u.id, u.password, u.name, u.email, u.role_id, r.name as role_name
        FROM users u 
        JOIN roles r ON u.role_id = r.id
        WHERE email = $1 
        LIMIT 1`,
        [payload.email],
      )) as User[];

      if (!user)
        throw new UnauthorizedException('Email atau Password anda salah');

      const isValidPassword = await bcrypt.compare(
        payload.password,
        user.password,
      );

      if (!isValidPassword) {
        throw new UnauthorizedException('Email atau Password anda salah');
      }

      if (user.is_admin === false)
        throw new UnauthorizedException('Akun anda tidak memiliki akses');

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [accessToken] = await Promise.all([
        this.jwtService.signAsync({
          id: user.id,
          name: user.name,
          email: user.email,
          roleId: user['role_id'],
          roleName: user['role_name'],
        }),
        queryRunner.manager.update(User, user.id, {
          last_login: new Date(),
        }),
      ]);

      await queryRunner.commitTransaction();

      return this.res.formatResponse({
        success: true,
        statusCode: 201,
        message: 'Login success',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          accessToken,
        },
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(error, `${AuthService.name}.${this.login.name}`);
    } finally {
      await queryRunner.release();
    }
  }

  async logout(token: string) {
    try {
      const tokenHash = createHash('sha256').update(token).digest('hex');
      await this.cacheManager.set(
        `${CACHE_PREFIX}:${tokenHash}`,
        'blacklisted',
        REDIS_TTL.ONE_DAY,
      );

      return this.res.formatResponse({
        success: true,
        statusCode: 201,
        message: 'Logout success',
      });
    } catch (error) {
      this.error.handleError(error, `${AuthService.name}.${this.logout.name}`);
    }
  }

  async getRole(user: IJwtPayload) {
    try {
      const [role]: [Role] = await this.repository.query(
        'SELECT r.access, r.name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = $1 AND u.role_id = $2 LIMIT 1',
        [user.id, user.roleId],
      );

      let permissions = role.access as unknown as IAccess[];

      if (typeof role.access === 'string') {
        permissions = JSON.parse(role.access) as IAccess[];
      }

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Get user role success',
        data: {
          id: role.id,
          name: role.name,
          access: permissions.map((access) => ({
            subject: access.subject,
            action: access.action,
          })),
        },
      });
    } catch (error) {
      this.error.handleError(error, `${AuthService.name}.${this.getRole.name}`);
    }
  }

  async checkPassword(password: string, authUser: IJwtPayload) {
    try {
      if (!password)
        throw new BadRequestException('Password tidak boleh kosong');

      const user = await this.repository.findOne({
        where: { id: authUser.id },
      });

      if (!user) throw new UnauthorizedException('Pengguna tidak ditemukan');

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) throw new BadRequestException('Password tidak valid');

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
      });
    } catch (error) {
      this.error.handleError(
        error,
        `${AuthService.name}.${this.checkPassword.name}`,
      );
    }
  }

  async updatePassword(password: string, authUser: IJwtPayload) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      if (!password)
        throw new BadRequestException('Password tidak boleh kosong');
      const user = await queryRunner.manager.findOne(User, {
        where: { id: authUser.id },
      });
      if (!user) throw new UnauthorizedException('Pengguna tidak ditemukan');

      const password_update_ts = new Date();
      const password_legacy = [];
      if (password) {
        password = await hashPassword(password);
        password_legacy.push(password);
      }

      const update = queryRunner.manager.create(User, {
        id: user.id,
        password,
        password_update_ts,
        password_legacy,
      });
      const updatedUser = await queryRunner.manager.save(update);

      await queryRunner.commitTransaction();

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: {
          id: updatedUser.id,
          name: updatedUser.name,
        },
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(
        error,
        `${AuthService.name}.${this.updatePassword.name}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async forgotPassword(email: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { email },
      });

      if (!user) throw new NotFoundException('Pengguna tidak ditemukan');

      const forgot_password_token = uuid();

      const update = queryRunner.manager.create(User, {
        id: user.id,
        forgot_password_token,
        forgot_password_expired_at: addMinutes(
          new Date(),
          DEFAULT_CONFIG.EXPIRED_TOKEN,
        ),
      });
      await queryRunner.manager.save(update);

      const url = `${process.env.FRONTEND_URL}/auth/reset-password/${forgot_password_token}`;

      this.mailService
        .sendTemplate({
          to: user.email,
          subject: 'Reset Password',
          template: 'forgot-password',
          data: {
            forgot_password_link: url,
            name: user.name,
          },
        })
        .catch((err) => {
          console.log(
            `Error when sending email - ${AuthService.name}.${this.login.name}`,
          );
          console.log(err);
        });

      await queryRunner.commitTransaction();

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(
        error,
        `${AuthService.name}.${this.forgotPassword.name}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async resetPassword(payload: ResetPasswordDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const update = queryRunner.manager.create(User, {
        password: await hashPassword(payload.password),
      });
      await queryRunner.manager.save(update);

      await queryRunner.commitTransaction();

      return this.res.formatResponse({
        success: true,
        statusCode: 200,
        message: 'Success',
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.error.handleError(
        error,
        `${AuthService.name}.${this.resetPassword.name}`,
      );
    } finally {
      await queryRunner.release();
    }
  }
}
