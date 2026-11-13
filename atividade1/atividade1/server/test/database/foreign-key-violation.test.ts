/// <reference types="jest" />
import { isForeignKeyViolation } from '../../src/database/foreign-key-violation';

describe('isForeignKeyViolation', () => {
  test('reconhece o código PostgreSQL 23503', () => {
    expect(isForeignKeyViolation({ code: '23503' })).toBe(true);
  });

  test.each([null, undefined, '23505', 23503, {}, { code: 'outro' }])(
    'retorna false para %p',
    (error) => {
      expect(isForeignKeyViolation(error)).toBe(false);
    },
  );
});
