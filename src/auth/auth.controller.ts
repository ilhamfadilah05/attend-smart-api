import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAppDto, LoginDto } from './dto/login.dto';
import { AuthGuard } from 'src/libs/guard/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { IJwtPayload } from 'src/libs/interface';
import { AuthUser } from 'src/libs/decorator/auth.decorator';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('login-app')
  @HttpCode(HttpStatus.OK)
  async loginApp(@Body() payload: LoginAppDto) {
    return this.service.loginApp(payload);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() payload: LoginDto) {
    return this.service.login(payload);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async logout(@Headers() headers: any) {
    const token = headers['authorization'].replace('Bearer ', '').trim();
    return this.service.logout(token);
  }

  @Get('role')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async getRole(@AuthUser() user: IJwtPayload) {
    return this.service.getRole(user);
  }

  @Post('check-password')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async checkPassword(
    @Body('password') password: string,
    @AuthUser() user: IJwtPayload,
  ) {
    return this.service.checkPassword(password, user);
  }

  @Patch('change-password')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async updatePassword(
    @Body('password') password: string,
    @AuthUser() user: IJwtPayload,
  ) {
    return this.service.updatePassword(password, user);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body('email') email: string) {
    return this.service.forgotPassword(email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() payload: ResetPasswordDto) {
    return this.service.resetPassword(payload);
  }
}
