import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import { UserProfile } from '@features/auth/domain/entities/user-profile.entity';
import { ProfileRepository } from '@features/auth/domain/repository/profile-repository';
import { UpdateMySucursalUseCase } from './update-my-sucursal.usecase';

describe('UpdateMySucursalUseCase', () => {
  let useCase: UpdateMySucursalUseCase;
  let repository: jest.Mocked<ProfileRepository>;

  beforeEach(() => {
    repository = { getMyProfile: jest.fn(), updateMySucursal: jest.fn() };

    TestBed.configureTestingModule({
      providers: [UpdateMySucursalUseCase, { provide: ProfileRepository, useValue: repository }],
    });

    useCase = TestBed.inject(UpdateMySucursalUseCase);
  });

  it('envía la sucursal al repositorio y devuelve el perfil actualizado', async () => {
    const profile: UserProfile = { id: 1, idUsuario: 7, idSucursal: 5 };
    repository.updateMySucursal.mockReturnValue(of(profile));

    await expect(firstValueFrom(useCase.execute(5))).resolves.toBe(profile);
    expect(repository.updateMySucursal).toHaveBeenCalledWith(5);
  });

  it('permite quitar la sucursal (null)', async () => {
    const profile: UserProfile = { id: 1, idUsuario: 7, idSucursal: null };
    repository.updateMySucursal.mockReturnValue(of(profile));

    await expect(firstValueFrom(useCase.execute(null))).resolves.toEqual(profile);
    expect(repository.updateMySucursal).toHaveBeenCalledWith(null);
  });

  it('propaga el error del repositorio', async () => {
    const error = new Error('400');
    repository.updateMySucursal.mockReturnValue(throwError(() => error));

    await expect(firstValueFrom(useCase.execute(5))).rejects.toBe(error);
  });
});
