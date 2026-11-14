import { HttpErrorResponse } from '@angular/common/http';

import { resolveHttpErrorMessage } from './http-error-resolver';

describe('resolveHttpErrorMessage', () => {
  const FALLBACK = 'Fallo por defecto';
  const httpError = (body: unknown, status = 400) =>
    new HttpErrorResponse({ error: body, status, statusText: 'Error', url: 'http://api.test/x' });

  // Claves conocidas del backend Django: error, message y detail.
  it.each([
    ['error', { error: 'Stock insuficiente' }, 'Stock insuficiente'],
    ['message', { message: 'Mensaje del backend' }, 'Mensaje del backend'],
    ['detail', { detail: 'Credenciales inválidas' }, 'Credenciales inválidas'],
  ])('lee el mensaje de la clave %s del cuerpo', (_clave, body, esperado) => {
    expect(resolveHttpErrorMessage(httpError(body), FALLBACK)).toBe(esperado);
  });

  // Prioridad entre claves: error > message > detail.
  it('prioriza error sobre message y detail', () => {
    const body = { detail: 'd', message: 'm', error: 'e' };

    expect(resolveHttpErrorMessage(httpError(body), FALLBACK)).toBe('e');
  });

  // Una clave con texto en blanco se salta y se usa la siguiente.
  it('salta una clave con valor en blanco y usa la siguiente', () => {
    expect(resolveHttpErrorMessage(httpError({ error: '   ', message: 'm' }), FALLBACK)).toBe('m');
  });

  // Formato {"error": ["..."]}: toma el primer elemento del arreglo.
  it('toma el primer elemento cuando la clave conocida es un arreglo de textos', () => {
    const body = { error: ['Stock insuficiente', 'Otro'] };

    expect(resolveHttpErrorMessage(httpError(body), FALLBACK)).toBe('Stock insuficiente');
  });

  // Validación por campo: {"cantidad": ["..."]} usa el primer arreglo de textos.
  it('usa el primer mensaje de validación por campo', () => {
    const body = { id: 3, cantidad: ['Stock insuficiente'] };

    expect(resolveHttpErrorMessage(httpError(body), FALLBACK)).toBe('Stock insuficiente');
  });

  // Un arreglo cuyo primer elemento no es texto no sirve como mensaje.
  it('ignora arreglos cuyo primer elemento no es texto y usa el mensaje de Angular', () => {
    const error = httpError({ cantidad: [1, 2] });

    expect(resolveHttpErrorMessage(error, FALLBACK)).toBe(error.message);
  });

  // Cuerpo de texto plano.
  it('devuelve el cuerpo cuando es un texto no vacío', () => {
    expect(resolveHttpErrorMessage(httpError('Servicio no disponible', 503), FALLBACK)).toBe(
      'Servicio no disponible',
    );
  });

  // Sin cuerpo útil: cae al mensaje del HttpErrorResponse.
  it.each([[null], [''], ['   '], [{}], [{ error: '' }]])(
    'usa el mensaje de HttpErrorResponse cuando el cuerpo es %p',
    (body) => {
      const error = httpError(body, 500);

      expect(resolveHttpErrorMessage(error, FALLBACK)).toBe(error.message);
      expect(error.message).toContain('500');
    },
  );

  // Si el HttpErrorResponse no trae mensaje se usa el fallback.
  it('usa el fallback si el HttpErrorResponse no tiene mensaje', () => {
    const error = httpError(null);
    Object.defineProperty(error, 'message', { value: '' });

    expect(resolveHttpErrorMessage(error, FALLBACK)).toBe(FALLBACK);
  });

  // Errores que no vienen de HTTP.
  it('devuelve el mensaje de un Error genérico', () => {
    expect(resolveHttpErrorMessage(new Error('Quantity inválida'), FALLBACK)).toBe('Quantity inválida');
  });

  it('usa el fallback para un Error sin mensaje', () => {
    expect(resolveHttpErrorMessage(new Error(''), FALLBACK)).toBe(FALLBACK);
  });

  // Valores desconocidos lanzados: nunca se interpretan, siempre fallback.
  it.each([['texto'], [null], [undefined], [42], [{ message: 'no es Error' }]])(
    'usa el fallback para el valor no-Error %p',
    (value) => {
      expect(resolveHttpErrorMessage(value, FALLBACK)).toBe(FALLBACK);
    },
  );
});
