import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaslAbilityFactory } from './casl-ability.factory';
import { Role } from '../entities/role.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Role])],
  providers: [CaslAbilityFactory],
  exports: [CaslAbilityFactory],
})
export class CaslModule {}
