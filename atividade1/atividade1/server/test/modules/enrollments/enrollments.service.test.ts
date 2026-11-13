/// <reference types="jest" />
import { EnrollmentsService } from '../../../src/modules/enrollments/enrollments.service';

describe('EnrollmentsService', () => {
  let service: EnrollmentsService;
  let repository: { create: jest.Mock; findAll: jest.Mock; findOne: jest.Mock };

  beforeEach(() => {
    repository = { create: jest.fn(), findAll: jest.fn(), findOne: jest.fn() };
    service = new EnrollmentsService(repository as any);
  });

  test('cria matrícula e encaminha RA e ID do curso em argumentos separados', async () => {
    const date = new Date('2026-01-01T00:00:00.000Z');
    const enrollment = { studentRa: 123, courseId: 1, enrolledAt: date };
    repository.create.mockResolvedValueOnce(enrollment);
    await expect(service.create({ studentRa: 123, courseId: 1 })).resolves.toBe(enrollment);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith(123, 1);
  });

  test.each([
    [{ studentRa: 0, courseId: 1 }],
    [{ studentRa: 123, courseId: 0 }],
  ])('rejeita identificadores inválidos %p com HTTP 400 sem chamar repositório', async (input) => {
    await expect(service.create(input)).rejects.toMatchObject({ statusCode: 400 });
    expect(repository.create).not.toHaveBeenCalled();
  });

  test('converte chave estrangeira inválida em HTTP 404', async () => {
    repository.create.mockRejectedValueOnce({ code: '23503' });
    await expect(service.create({ studentRa: 123, courseId: 1 })).rejects.toMatchObject({ statusCode: 404 });
  });

  test('converte matrícula duplicada em HTTP 409', async () => {
    repository.create.mockRejectedValueOnce({ code: '23505' });
    await expect(service.create({ studentRa: 123, courseId: 1 })).rejects.toMatchObject({ statusCode: 409 });
  });

  test('busca matrícula inexistente, encaminha os dois identificadores e lança HTTP 404', async () => {
    repository.findOne.mockResolvedValueOnce(undefined);
    await expect(service.findOne(123, 1)).rejects.toMatchObject({ statusCode: 404 });
    expect(repository.findOne).toHaveBeenCalledWith(123, 1);
  });

  test('propaga a mesma falha inesperada durante criação', async () => {
    const error = new Error('Falha inesperada');
    repository.create.mockRejectedValueOnce(error);
    await expect(service.create({ studentRa: 123, courseId: 1 })).rejects.toBe(error);
  });

  test('lista matrículas e chama findAll uma vez sem argumentos', async () => {
    const rows = [{ studentRa: 123, courseId: 1, enrolledAt: new Date('2026-01-01T00:00:00Z') }];
    repository.findAll.mockResolvedValueOnce(rows);
    await expect(service.findAll()).resolves.toBe(rows);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(repository.findAll).toHaveBeenCalledWith();
  });

  test('retorna matrícula existente e encaminha os dois identificadores', async () => {
    const row = { studentRa: 123, courseId: 1, enrolledAt: new Date('2026-01-01T00:00:00Z') };
    repository.findOne.mockResolvedValueOnce(row);
    await expect(service.findOne(123, 1)).resolves.toBe(row);
    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123, 1);
  });
});
