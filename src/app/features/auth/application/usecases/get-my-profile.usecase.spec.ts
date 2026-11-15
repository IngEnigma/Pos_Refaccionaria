import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import { UserProfile } from '@features/auth/domain/entities/user-profile.entity';
import { ProfileRepository } from '@features/auth/domain/repository/profile-repository';
import { GetMyProfileUseCase } from './get-my-profile.usecase';

describe('GetMyProfileUseCase', () => {
  let useCase: GetMyProfileUseCase;
  let repository: jest.Mocked<ProfileRepository>;

  beforeEach(() => {
    repository = { getMyProfile: jest.fn(), updateMySucursal: jest.fn() };

    TestBed.configureTestingModule({
      providers: [GetMyProfileUseCase, { provide: ProfileRepository, useValue: repository }],
    });

    useCase = TestBed.inject(GetMyProfileUseCase);
  });

  it('devuelve el perfil del repositorio', async () => {
    const profile: UserProfile = { id: 1, idUsuario: 7, idSucursal: 3 };
    repository.getMyProfile.mockReturnValue(of(profile));

    await expect(firstValueFrom(useCase.execute())).resolves.toBe(profile);
    expect(repository.getMyProfile).toHaveBeenCalledTimes(1);
  });

  it('propaga el error del repositorio', async () => {
    const error = new Error('500');
    repository.getMyProfile.mockReturnValue(throwError(() => error));

    await expect(firstValueFrom(useCase.execute())).rejects.toBe(error);
  });
});
