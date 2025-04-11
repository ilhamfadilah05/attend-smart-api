import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { createHash } from 'crypto';
import { IJwtPayload } from '../interface';
import { CACHE_PREFIX } from '../constant';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) throw new UnauthorizedException();

    try {
      const tokenHash = createHash('sha256').update(token).digest('hex');
      const isBlacklisted = await this.cacheManager.get(
        `${CACHE_PREFIX}:${tokenHash}`,
      );

      if (isBlacklisted) throw new UnauthorizedException();

      const user = await this.jwtService.verifyAsync<IJwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      });

      request['user'] = user;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
