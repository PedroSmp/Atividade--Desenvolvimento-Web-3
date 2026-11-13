/// <reference types="jest" />
import { PgStudentRepository } from '../../../src/modules/students/students.repository';

const normalizeSql = (sql: string) => sql.replace(/\s+/g, ' ').trim();

describe('PgStudentRepository', () => {
  let repository: PgStudentRepository;
  let db: { query: jest.Mock };

  beforeEach(() => {
    db = { query: jest.fn() };
    repository = new PgStudentRepository(db as any);
  });

  test('cria aluno com SQL parametrizado e retorna a linha', async () => {
    const row = { ra: 123, name: 'Ana' };
    db.query.mockResolvedValueOnce({ rows: [row] });
    await expect(repository.create(row)).resolves.toEqual(row);
    expect(db.query).toHaveBeenCalledTimes(1);
    const [sql, params] = db.query.mock.calls[0];
    expect(normalizeSql(sql)).toBe('INSERT INTO students (ra, name) VALUES ($1, $2) RETURNING ra, name');
    expect(params).toEqual([123, 'Ana']);
  });

  test('lista alunos com ORDER BY name e sem parâmetros', async () => {
    const rows = [{ ra: 123, name: 'Ana' }];
    db.query.mockResolvedValueOnce({ rows });
    await expect(repository.findAll()).resolves.toEqual(rows);
    const [sql, params] = db.query.mock.calls[0];
    expect(normalizeSql(sql)).toBe('SELECT ra, name FROM students ORDER BY name');
    expect(params).toBeUndefined();
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  test('retorna lista vazia quando não há alunos', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(repository.findAll()).resolves.toEqual([]);
  });

  test('busca aluno por RA e retorna a primeira linha', async () => {
    const row = { ra: 123, name: 'Ana' };
    db.query.mockResolvedValueOnce({ rows: [row] });
    await expect(repository.findOne(123)).resolves.toEqual(row);
    const [sql, params] = db.query.mock.calls[0];
    expect(normalizeSql(sql)).toBe('SELECT ra, name FROM students WHERE ra = $1');
    expect(params).toEqual([123]);
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  test('retorna undefined quando aluno não existe', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(repository.findOne(123)).resolves.toBeUndefined();
  });

  test.each(['create', 'findAll', 'findOne'] as const)('propaga a mesma falha do banco em %s', async (method) => {
    const error = new Error('Falha no banco');
    db.query.mockRejectedValueOnce(error);
    const operation = method === 'create'
      ? repository.create({ ra: 123, name: 'Ana' })
      : method === 'findAll'
        ? repository.findAll()
        : repository.findOne(123);
    await expect(operation).rejects.toBe(error);
  });
});
