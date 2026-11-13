/// <reference types="jest" />
import { PgCourseRepository } from '../../../src/modules/courses/courses.repository';

const normalizeSql = (sql: string) => sql.replace(/\s+/g, ' ').trim();

describe('PgCourseRepository', () => {
  let repository: PgCourseRepository;
  let db: { query: jest.Mock };

  beforeEach(() => {
    db = { query: jest.fn() };
    repository = new PgCourseRepository(db as any);
  });

  test('cria curso com SQL parametrizado e retorna a linha', async () => {
    const row = { id: 7, name: 'Qualidade' };
    db.query.mockResolvedValueOnce({ rows: [row] });
    await expect(repository.create({ name: 'Qualidade' })).resolves.toEqual(row);
    expect(db.query).toHaveBeenCalledTimes(1);
    const [sql, params] = db.query.mock.calls[0];
    expect(normalizeSql(sql)).toBe('INSERT INTO courses (name) VALUES ($1) RETURNING id, name');
    expect(params).toEqual(['Qualidade']);
  });

  test('lista cursos com ORDER BY id e sem parâmetros', async () => {
    const rows = [{ id: 7, name: 'Qualidade' }];
    db.query.mockResolvedValueOnce({ rows });
    await expect(repository.findAll()).resolves.toEqual(rows);
    const [sql, params] = db.query.mock.calls[0];
    expect(normalizeSql(sql)).toBe('SELECT id, name FROM courses ORDER BY id');
    expect(params).toBeUndefined();
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  test('retorna lista vazia quando não há cursos', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(repository.findAll()).resolves.toEqual([]);
  });

  test('busca curso por id e retorna a primeira linha', async () => {
    const row = { id: 7, name: 'Qualidade' };
    db.query.mockResolvedValueOnce({ rows: [row] });
    await expect(repository.findOne(7)).resolves.toEqual(row);
    const [sql, params] = db.query.mock.calls[0];
    expect(normalizeSql(sql)).toBe('SELECT id, name FROM courses WHERE id = $1');
    expect(params).toEqual([7]);
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  test('retorna undefined quando curso não existe', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(repository.findOne(7)).resolves.toBeUndefined();
  });

  test.each(['create', 'findAll', 'findOne'] as const)('propaga a mesma falha do banco em %s', async (method) => {
    const error = new Error('Falha no banco');
    db.query.mockRejectedValueOnce(error);
    const operation = method === 'create'
      ? repository.create({ name: 'Qualidade' })
      : method === 'findAll'
        ? repository.findAll()
        : repository.findOne(7);
    await expect(operation).rejects.toBe(error);
  });
});
