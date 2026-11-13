/// <reference types="jest" />
import { StudentsService } from '../../../src/modules/students/students.service';

describe('StudentsService', () => {
  let service: StudentsService;
  let repository: { create: jest.Mock; findAll: jest.Mock; findOne: jest.Mock };

  beforeEach(() => {
    repository = { create: jest.fn(), findAll: jest.fn(), findOne: jest.fn() };
    service = new StudentsService(repository as any);
  });

  test('cria aluno válido e encaminha os dados ao repositório', async () => {
    const input = { ra: 123, name: 'Ana' };
    const student = { ...input };
    repository.create.mockResolvedValueOnce(student);
    await expect(service.create(input)).resolves.toBe(student);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith(input);
  });

  test('rejeita RA inválido com HTTP 400 sem chamar repositório', async () => {
    await expect(service.create({ ra: 0, name: 'Ana' })).rejects.toMatchObject({ statusCode: 400 });
    expect(repository.create).not.toHaveBeenCalled();
  });

  test('converte RA duplicado em HTTP 409', async () => {
    repository.create.mockRejectedValueOnce({ code: '23505' });
    await expect(service.create({ ra: 123, name: 'Ana' })).rejects.toMatchObject({ statusCode: 409 });
  });

  test('lança HTTP 404 quando aluno não existe', async () => {
    repository.findOne.mockResolvedValueOnce(undefined);
    await expect(service.findOne(123)).rejects.toMatchObject({ statusCode: 404 });
  });

  test('propaga a mesma falha inesperada durante criação', async () => {
    const error = new Error('Falha inesperada');
    repository.create.mockRejectedValueOnce(error);
    await expect(service.create({ ra: 123, name: 'Ana' })).rejects.toBe(error);
  });

  test('lista alunos e chama findAll uma vez sem argumentos', async () => {
    const students = [{ ra: 123, name: 'Ana' }];
    repository.findAll.mockResolvedValueOnce(students);
    await expect(service.findAll()).resolves.toBe(students);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(repository.findAll).toHaveBeenCalledWith();
  });

  test('retorna aluno existente e encaminha RA uma vez', async () => {
    const student = { ra: 123, name: 'Ana' };
    repository.findOne.mockResolvedValueOnce(student);
    await expect(service.findOne(123)).resolves.toBe(student);
    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123);
  });
});
