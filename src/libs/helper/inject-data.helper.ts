import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
import { Role } from '../entities/role.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class InjectDataHelper implements OnModuleInit {
  constructor(
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async onModuleInit(): Promise<void> {
    const filePathDefaultAccess = path.join(
      __dirname,
      '..',
      '/config/default-access.json',
    );
    const access = fs.readFileSync(filePathDefaultAccess, {
      encoding: 'utf-8',
    });

    // inject role
    const newRole = {
      name: process.env.ADMIN_ROLE_NAME,
      access: JSON.stringify(JSON.parse(access)),
    };

    const [isRoleExists] = (await this.roleRepository.query(
      'SELECT roles.id, roles.name, roles.access FROM roles WHERE roles.name = $1 LIMIT 1',
      [newRole.name],
    )) as Role[];

    const role = this.roleRepository.create({
      name: newRole.name,
      access: newRole.access,
    });

    let savedRole: Role;

    if (!isRoleExists) {
      const result = await this.roleRepository.save(role);
      savedRole = result;
    } else {
      await this.roleRepository.update(
        { name: role.name },
        { access: role.access },
      );
    }

    // inject user
    const admin = {
      name: process.env.ADMIN_NAME,
      email: process.env.ADMIN_EMAIL,
      password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10),
      role: savedRole,
    };

    const [isAdminExists] = (await this.userRepository.query(
      'SELECT users.email FROM users WHERE email = $1 LIMIT 1',
      [admin.email],
    )) as User[];

    if (!isAdminExists) {
      const user = this.userRepository.create(admin);
      await this.userRepository.save(user);
    }
  }
}
