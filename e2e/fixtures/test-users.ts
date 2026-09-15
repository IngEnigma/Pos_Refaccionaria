/**
 * Usuarios seed para pruebas E2E contra backend real.
 * Fuente: DB de pruebas (creados vía POST /api/users con id_sucursal).
 * SOLO ambiente de pruebas — no usar en producción.
 * Passwords aquí porque son cuentas de test desechables; si rotan,
 * actualizar este archivo y no esparcirlos en otros specs/docs.
 */

export interface TestUser {
  username: string;
  password: string;
  email: string;
  sucursalId: number | null;
  ubicacion: string;
  uso: string;
}

export const TEST_USERS = {
  /** Vendedora Centro (flujo feliz POS, SIS-010). */
  anaCentro: {
    username: 'ana.centro',
    password: 'Ana12345',
    email: 'ana.centro@refaccionaria.com',
    sucursalId: 1,
    ubicacion: 'Centro CDMX - Av Reforma 123',
    uso: 'POS mostrador Centro, flujo feliz de venta',
  },
  carlosCentro: {
    username: 'carlos.centro',
    password: 'Carlos123',
    email: 'carlos.centro@refaccionaria.com',
    sucursalId: 1,
    ubicacion: 'Centro CDMX - Av Reforma 123',
    uso: 'Segundo usuario Centro (colisiones, sesiones paralelas)',
  },
  gerenteGeneral: {
    username: 'gerente.general',
    password: 'Gerente123',
    email: 'gerente@refaccionaria.com',
    sucursalId: 1,
    ubicacion: 'Centro CDMX - Av Reforma 123',
    uso: 'Permisos elevados, reportes, precios por sucursal',
  },
  mariaNorte: {
    username: 'maria.norte',
    password: 'Maria123',
    email: 'maria.norte@refaccionaria.com',
    sucursalId: 2,
    ubicacion: 'Norte Monterrey - Av Industrial 456',
    uso: 'POS Norte, precio diferenciado por sucursal (SIS-023)',
  },
  jorgeNorte: {
    username: 'jorge.norte',
    password: 'Jorge123',
    email: 'jorge.norte@refaccionaria.com',
    sucursalId: 2,
    ubicacion: 'Norte Monterrey - Av Industrial 456',
    uso: 'Segundo usuario Norte',
  },
  luisSur: {
    username: 'luis.sur',
    password: 'Luis12345',
    email: 'luis.sur@refaccionaria.com',
    sucursalId: 3,
    ubicacion: 'Sur Puebla - Blvd Atlixco 789',
    uso: 'POS Sur, inventario por sucursal (SIS-022)',
  },
  sofiaSur: {
    username: 'sofia.sur',
    password: 'Sofia123',
    email: 'sofia.sur@refaccionaria.com',
    sucursalId: 3,
    ubicacion: 'Sur Puebla - Blvd Atlixco 789',
    uso: 'Segunda usuaria Sur',
  },
  /** Sin sucursal: debe ver empty-state "Tu usuario no tiene sucursal asignada." */
  adminSinPerfil: {
    username: 'admin_neon',
    password: 'Admin1234',
    email: 'admin@refaccionaria.com',
    sucursalId: null,
    ubicacion: 'SIN PERFIL',
    uso: 'Valida bloqueo de POS sin sucursal (SIS-013)',
  },
  vendedorSinPerfil: {
    username: 'vendedor1',
    password: 'Vendedor123',
    email: 'vendedor1@refaccionaria.com',
    sucursalId: null,
    ubicacion: 'SIN PERFIL',
    uso: 'Valida guard + empty-state sin sucursal',
  },
} satisfies Record<string, TestUser>;

/** Usuario por defecto para el smoke real: tiene sucursal y rol mostrador. */
export const DEFAULT_REAL_USER = TEST_USERS.anaCentro;
