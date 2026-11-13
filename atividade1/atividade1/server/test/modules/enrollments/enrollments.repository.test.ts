/// <reference types="jest" />
import { PgEnrollmentRepository } from '../../../src/modules/enrollments/enrollments.repository';

const normalizeSql = (sql: string) => sql.replace(/\s+/g, ' ').trim();

describe('PgEnrollmentRepository', () => {
  let repository: PgEnrollmentRepository;
  let db: { query: jest.Mock };

  beforeEach(() => {
    db = { query: jest.fn() };
    repository = new PgEnrollmentRepository(db as any);
  });

  test('cria matrícula com aliases camelCase, parâmetros e data retornada', async () => {
    const enrolledAt = new Date('2026-01-01T00:00:00.000Z');
    const row = { studentRa: 123, courseId: 7, enrolledAt };
    db.query.mockResolvedValueOnce({ rows: [row] });
    await expect(repository.create(123, 7)).resolves.toEqual(row);
    expect(db.query).toHaveBeenCalledTimes(1);
    const [sql, params] = db.query.mock.calls[0];
    expect(normalizeSql(sql)).toBe(
      'INSERT INTO enrollments (student_ra, course_id) VALUES ($1, $2) RETURNING student_ra AS "studentRa", course_id AS "courseId", enrolled_at AS "enrolledAt"',
    );
    expect(params).toEqual([123, 7]);
  });

  test('lista matrículas com aliases, ordenação e sem parâmetros', async () => {
    const rows = [{ studentRa: 123, courseId: 7, enrolledAt: new Date('2026-01-01T00:00:00Z') }];
    db.query.mockResolvedValueOnce({ rows });
    await expect(repository.findAll()).resolves.toEqual(rows);
    const [sql, params] = db.query.mock.calls[0];
    expect(normalizeSql(sql)).toBe(
      'SELECT student_ra AS "studentRa", course_id AS "courseId", enrolled_at AS "enrolledAt" FROM enrollments ORDER BY student_ra, course_id',
    );
    expect(params).toBeUndefined();
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  test('retorna lista vazia quando não há matrículas', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(repository.findAll()).resolves.toEqual([]);
  });

  test('busca matrícula pelos dois identificadores e retorna a primeira linha', async () => {
    const row = { studentRa: 123, courseId: 7, enrolledAt: new Date('2026-01-01T00:00:00Z') };
    db.query.mockResolvedValueOnce({ rows: [row] });
    await expect(repository.findOne(123, 7)).resolves.toEqual(row);
    const [sql, params] = db.query.mock.calls[0];
    expect(normalizeSql(sql)).toBe(
      'SELECT student_ra AS "studentRa", course_id AS "courseId", enrolled_at AS "enrolledAt" FROM enrollments WHERE student_ra = $1 AND course_id = $2',
    );
    expect(params).toEqual([123, 7]);
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  test('retorna undefined quando matrícula não existe', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(repository.findOne(123, 7)).resolves.toBeUndefined();
  });

  test.each(['create', 'findAll', 'findOne'] as const)('propaga a mesma falha do banco em %s', async (method) => {
    const error = new Error('Falha no banco');
    db.query.mockRejectedValueOnce(error);
    const operation = method === 'create'
      ? repository.create(123, 7)
      : method === 'findAll'
        ? repository.findAll()
        : repository.findOne(123, 7);
    await expect(operation).rejects.toBe(error);
  });
});
