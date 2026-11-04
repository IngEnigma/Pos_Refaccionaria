import { ClientMapper } from './client.mapper';
import { ClientResponseDto } from '@features/clients/application/dtos/client-response.dto';

// Unitario: transformaciones snake_case <-> camelCase y normalización de opcionales.
describe('ClientMapper', () => {
  const dto: ClientResponseDto = {
    id: 25,
    id_sucursal: 1,
    nombre: 'Juan',
    apellido_paterno: 'Pérez',
    apellido_materno: 'López',
    telefono: '2711234567',
    correo: 'juan@ejemplo.com',
    direccion: 'Calle 1',
    rfc: 'PEJU800101',
  };

  // Comprueba que la respuesta del backend se convierta a la entidad de dominio en camelCase.
  it('fromResponseDto convierte snake_case a la entidad Client', () => {
    const client = ClientMapper.fromResponseDto(dto);

    expect(client).toEqual({
      id: 25,
      idSucursal: 1,
      nombre: 'Juan',
      apellidoPaterno: 'Pérez',
      apellidoMaterno: 'López',
      telefono: '2711234567',
      correo: 'juan@ejemplo.com',
      direccion: 'Calle 1',
      rfc: 'PEJU800101',
    });
  });

  // Comprueba que el payload de alta llegue al backend en snake_case.
  it('toCreateRequestDto convierte camelCase a snake_case', () => {
    const request = ClientMapper.toCreateRequestDto({
      idSucursal: 1,
      nombre: 'Juan',
      apellidoPaterno: 'Pérez',
      apellidoMaterno: 'López',
      telefono: '2711234567',
      correo: 'juan@ejemplo.com',
      direccion: 'Calle 1',
      rfc: 'PEJU800101',
    });

    expect(request).toEqual({
      id_sucursal: 1,
      nombre: 'Juan',
      apellido_paterno: 'Pérez',
      apellido_materno: 'López',
      telefono: '2711234567',
      correo: 'juan@ejemplo.com',
      direccion: 'Calle 1',
      rfc: 'PEJU800101',
    });
  });

  // Comprueba que los campos opcionales ausentes viajen como null en el alta.
  it('toCreateRequestDto normaliza opcionales ausentes a null', () => {
    const request = ClientMapper.toCreateRequestDto({
      idSucursal: 1,
      nombre: 'Juan',
      apellidoPaterno: 'Pérez',
      telefono: '2711234567',
    });

    expect(request.apellido_materno).toBeNull();
    expect(request.correo).toBeNull();
    expect(request.direccion).toBeNull();
    expect(request.rfc).toBeNull();
  });

  // Comprueba que la actualización parcial conserve los valores tal cual, sin forzar null.
  it('toUpdateRequestDto conserva los valores del payload parcial', () => {
    const request = ClientMapper.toUpdateRequestDto({ nombre: 'Juan Carlos' });

    expect(request.nombre).toBe('Juan Carlos');
    expect(request.id_sucursal).toBeUndefined();
    expect(request.apellido_paterno).toBeUndefined();
    expect(request.telefono).toBeUndefined();
    // Los opcionales también quedan sin valor cuando no se enviaron.
    expect(request.apellido_materno).toBeUndefined();
    expect(request.correo).toBeUndefined();
  });
});
