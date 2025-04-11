import { createParamDecorator } from '@nestjs/common';

export const AuthUser = createParamDecorator((data, req) => {
  const user = req.switchToHttp().getRequest().user;
  return user;
});
