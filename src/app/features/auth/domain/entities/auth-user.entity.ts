import { UserRole } from "@features/auth/domain/value-objects/auth-user-role.enum";

export class User {
  constructor(
    public readonly id: string,
    public readonly role: UserRole,
  ) {}
}
