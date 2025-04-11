import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { readFile } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class SandraHelperService {
  constructor(private jwtService: JwtService) {}

  async authToken() {
    const privateKey = await readFile(
      join(__dirname, '..', '..', '/secret/sandra/sandra_private_key.pem'),
      'utf-8',
    );

    return this.jwtService.signAsync(
      {},
      {
        algorithm: 'RS256',
        secret: privateKey,
      },
    );
  }
}
