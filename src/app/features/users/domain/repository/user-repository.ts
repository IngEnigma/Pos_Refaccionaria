import { Observable } from 'rxjs';

import { User } from '@features/users/domain/entities/user.entity';

export interface CreateUserPayload {
  username: string;
  password: string;
  email: string;
  isActive: boolean;
}

export interface UpdateUserPayload {
  username?: string;
  password?: string;
  email?: string;
  isActive?: boolean;
}

export abstract class UserRepository {
  abstract getUsers(): Observable<User[]>;
  abstract createUser(payload: CreateUserPayload): Observable<User>;
  abstract updateUser(id: number, payload: UpdateUserPayload): Observable<User>;
  abstract deleteUser(id: number): Observable<void>;
}
