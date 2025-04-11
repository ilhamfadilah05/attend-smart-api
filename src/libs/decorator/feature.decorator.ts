import { createParamDecorator } from '@nestjs/common';

export const Features = createParamDecorator((data, req) => {
  const request = req.switchToHttp().getRequest();
  return request['additional-feature'];
});
