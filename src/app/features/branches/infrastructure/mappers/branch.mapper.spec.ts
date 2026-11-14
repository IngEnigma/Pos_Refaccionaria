import { BranchResponseDto } from '@features/branches/application/dtos/branch-response.dto';
import {
  CreateBranchPayload,
  UpdateBranchPayload,
} from '@features/branches/domain/repository/branch-repository';
import { BranchMapper } from './branch.mapper';

describe('BranchMapper', () => {
  const fullDto: BranchResponseDto = {
    id: 7,
    nombre_sucursal: 'Centro',
    codigo_sucursal: 'SUC-ABC123',
    ubicacion: 'Calle 1, Tuxtla',
    codigo_postal: '29000',
    numero_telefono: '9611234567',
    correo_electronico: 'centro@trt.com',
  };

  describe('fromResponseDto', () => {
    it('convierte snake_case del backend a la entidad camelCase', () => {
      const branch = BranchMapper.fromResponseDto(fullDto);

      expect(branch).toEqual({
        id: 7,
        nombreSucursal: 'Centro',
        codigoSucursal: 'SUC-ABC123',
        ubicacion: 'Calle 1, Tuxtla',
        codigoPostal: '29000',
        numeroTelefono: '9611234567',
        correoElectronico: 'centro@trt.com',
      });
    });

    it('rellena con cadena vacía los campos opcionales ausentes', () => {
      const branch = BranchMapper.fromResponseDto({ id: 2, ubicacion: 'Solo ubicación' });

      expect(branch).toEqual({
        id: 2,
        nombreSucursal: '',
        codigoSucursal: '',
        ubicacion: 'Solo ubicación',
        codigoPostal: '',
        numeroTelefono: '',
        correoElectronico: '',
      });
    });

    it('rellena con cadena vacía los campos que llegan como null', () => {
      const dto = {
        id: 3,
        ubicacion: null,
        nombre_sucursal: null,
        codigo_sucursal: null,
        codigo_postal: null,
        numero_telefono: null,
        correo_electronico: null,
      } as unknown as BranchResponseDto;

      const branch = BranchMapper.fromResponseDto(dto);

      expect(branch).toEqual({
        id: 3,
        nombreSucursal: '',
        codigoSucursal: '',
        ubicacion: '',
        codigoPostal: '',
        numeroTelefono: '',
        correoElectronico: '',
      });
    });
  });

  describe('toCreateRequestDto', () => {
    it('convierte el payload camelCase a snake_case para el backend', () => {
      const payload: CreateBranchPayload = {
        nombreSucursal: 'Norte',
        ubicacion: 'Av. Norte 10',
        codigoPostal: '29010',
        numeroTelefono: '9617654321',
        correoElectronico: 'norte@trt.com',
      };

      expect(BranchMapper.toCreateRequestDto(payload)).toEqual({
        nombre_sucursal: 'Norte',
        ubicacion: 'Av. Norte 10',
        codigo_postal: '29010',
        numero_telefono: '9617654321',
        correo_electronico: 'norte@trt.com',
      });
    });

    it('no envía el código de sucursal (lo genera el backend)', () => {
      const dto = BranchMapper.toCreateRequestDto({
        nombreSucursal: 'Norte',
        ubicacion: 'Av. Norte 10',
        codigoPostal: '29010',
        numeroTelefono: '9617654321',
        correoElectronico: 'norte@trt.com',
      });

      expect(dto).not.toHaveProperty('codigo_sucursal');
    });
  });

  describe('toUpdateRequestDto', () => {
    it('convierte todos los campos informados a snake_case', () => {
      const payload: UpdateBranchPayload = {
        nombreSucursal: 'Sur',
        ubicacion: 'Av. Sur 5',
        codigoPostal: '29020',
        numeroTelefono: '9610000000',
        correoElectronico: 'sur@trt.com',
      };

      expect(BranchMapper.toUpdateRequestDto(payload)).toEqual({
        nombre_sucursal: 'Sur',
        ubicacion: 'Av. Sur 5',
        codigo_postal: '29020',
        numero_telefono: '9610000000',
        correo_electronico: 'sur@trt.com',
      });
    });

    it('omite en el JSON los campos opcionales no informados', () => {
      const dto = BranchMapper.toUpdateRequestDto({ nombreSucursal: 'Solo nombre' });

      expect(JSON.parse(JSON.stringify(dto))).toEqual({ nombre_sucursal: 'Solo nombre' });
    });

    it('devuelve un DTO sin valores definidos si el payload viene vacío', () => {
      const dto = BranchMapper.toUpdateRequestDto({});

      expect(JSON.parse(JSON.stringify(dto))).toEqual({});
    });
  });

  it('ida y vuelta: respuesta -> entidad -> payload de creación conserva los datos editables', () => {
    const branch = BranchMapper.fromResponseDto(fullDto);

    const dto = BranchMapper.toCreateRequestDto(branch);

    expect(dto).toEqual({
      nombre_sucursal: fullDto.nombre_sucursal,
      ubicacion: fullDto.ubicacion,
      codigo_postal: fullDto.codigo_postal,
      numero_telefono: fullDto.numero_telefono,
      correo_electronico: fullDto.correo_electronico,
    });
  });
});
