/// <reference types="jest" />

import { HttpError } from '../src/errors';
import { positiveInteger, parseId, validateName, validateBody } from '../src/validation';

describe('positiveInteger', () => {
  test.each([1, 2147483647])('aceita o inteiro positivo %p', (value) => {
    expect(positiveInteger(value, 'RA')).toBe(value);
  });

  test.each([0, -1, 1.5, NaN, Infinity, 2147483648, '123', null, undefined])(
    'rejeita a entrada inválida %p com HTTP 400',
    (value) => {
      try {
        positiveInteger(value, 'RA');
        throw new Error('Era esperado um HttpError');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        expect(error).toMatchObject({ statusCode: 400 });
      }
    },
  );
});

describe('parseId', () => {
  test.each([['1', 1], ['2147483647', 2147483647]])(
    'converte %p para %p',
    (value, expected) => {
      expect(parseId(value, 'RA')).toBe(expected);
    },
  );

  test.each(['1abc', '1.2', '1e2', '', '-1', '0', '2147483648', 123])(
    'rejeita a entrada inválida %p com HTTP 400',
    (value) => {
      expect(() => parseId(value, 'RA')).toThrow(
        expect.objectContaining({ statusCode: 400 }),
      );
    },
  );
});

describe('validateName', () => {
  test.each(['Ana', 'a'.repeat(100)])('aceita nome válido', (value) => {
    expect(validateName(value)).toBe(value);
  });

  test.each(['', 'ab', '   ', ' a ', 'a'.repeat(101), 123, null, undefined])(
    'rejeita nome inválido %p com HTTP 400',
    (value) => {
      expect(() => validateName(value)).toThrow(
        expect.objectContaining({ statusCode: 400 }),
      );
    },
  );
});

describe('validateBody', () => {
  test('aceita objeto congelado sem modificar ou substituir a referência', () => {
    const body = Object.freeze({ name: 'Ana' });
    expect(validateBody(body)).toBe(body);
    expect(body).toEqual({ name: 'Ana' });
  });

  test.each([null, undefined, [], 'Ana', 12])(
    'rejeita corpo inválido %p com HTTP 400',
    (value) => {
      expect(() => validateBody(value)).toThrow(
        expect.objectContaining({ statusCode: 400 }),
      );
    },
  );

  test('aceita campos extras e preserva a mesma referência', () => {
    const body = { name: 'Ana', extra: true };
    expect(validateBody(body)).toBe(body);
    expect(body).toEqual({ name: 'Ana', extra: true });
  });
});
