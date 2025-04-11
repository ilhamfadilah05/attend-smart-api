import { PureAbility } from '@casl/ability';
import { SetMetadata } from '@nestjs/common';

interface IPolicyHandler {
  handle(ability: PureAbility): boolean;
}
type PolicyHandlerCallback = (ability: PureAbility) => boolean;

export type PolicyHandler = IPolicyHandler | PolicyHandlerCallback;
export const ROLES_KEY = 'check-roles';
export const CheckRoles = (...handlers: PolicyHandler[]) =>
  SetMetadata(ROLES_KEY, handlers);
