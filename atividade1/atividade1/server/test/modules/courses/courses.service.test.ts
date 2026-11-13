/// <reference types="jest" />
import { CoursesService } from '../../../src/modules/courses/courses.service';

describe('CoursesService', () => {
  let service: CoursesService;
  let repository: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
  };

  beforeEach(() => {
    repository = { create: jest.fn(), findAll: jest.fn(), findOne: jest.fn() };
    service = new CoursesService(repository as any);
  });

  test('cria curso válido e encaminha os dados ao repositório uma vez', async () => {
    const input = { name: 'Qualidade' };
    const created = { id: 1, name: 'Qualidade' };
    repository.create.mockResolvedValueOnce(created);

    await expect(service.create(input)).resolves.toBe(created);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith(input);
  });

  test.each([null, {}, { name: 'A' }])('rejeita entrada inválida %p com HTTP 400 sem chamar repositório', async (input) => {
    await expect(service.create(input)).rejects.toMatchObject({ statusCode: 400 });
    expect(repository.create).not.toHaveBeenCalled();
  });

  test('converte violação de unicidade em HTTP 409', async () => {
    repository.create.mockRejectedValueOnce({ code: '23505' });
    await expect(service.create({ name: 'Qualidade' })).rejects.toMatchObject({ statusCode: 409 });
  });

  test('lista cursos usando stub e chama findAll uma vez', async () => {
    const courses = [{ id: 1, name: 'Qualidade' }];
    repository.findAll.mockResolvedValueOnce(courses);
    await expect(service.findAll()).resolves.toBe(courses);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
  });

  test('retorna curso existente e encaminha o identificador', async () => {
    const course = { id: 123, name: 'Qualidade' };
    repository.findOne.mockResolvedValueOnce(course);
    await expect(service.findOne(123)).resolves.toBe(course);
    expect(repository.findOne).toHaveBeenCalledWith(123);
  });

  test('lança HTTP 404 quando o curso não existe', async () => {
    repository.findOne.mockResolvedValueOnce(undefined);
    await expect(service.findOne(123)).rejects.toMatchObject({ statusCode: 404 });
  });

  test('rejeita identificador inválido com HTTP 400 sem consultar repositório', async () => {
    await expect(service.findOne(0)).rejects.toMatchObject({ statusCode: 400 });
    expect(repository.findOne).not.toHaveBeenCalled();
  });

  test.each(['create', 'findAll', 'findOne'] as const)('propaga a mesma falha inesperada em %s', async (method) => {
    const error = new Error('Falha inesperada');
    repository[method].mockRejectedValueOnce(error);
    const operation = method === 'create'
      ? service.create({ name: 'Qualidade' })
      : method === 'findAll'
        ? service.findAll()
        : service.findOne(1);
    await expect(operation).rejects.toBe(error);
  });

  test('usa spy para observar findOne de um stub existente', async () => {
    const stub = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn().mockResolvedValue({ id: 1, name: 'Qualidade' }),
    };
    const findOneSpy = jest.spyOn(stub, 'findOne');
    const serviceWithStub = new CoursesService(stub as any);

    await expect(serviceWithStub.findOne(1)).resolves.toEqual({ id: 1, name: 'Qualidade' });
    expect(findOneSpy).toHaveBeenCalledWith(1);
  });

  test('ignora campos extras e envia somente name ao repositório', async () => {
    repository.create.mockResolvedValueOnce({ id: 1, name: 'Qualidade' });
    await service.create({ name: 'Qualidade', extra: true });
    expect(repository.create).toHaveBeenCalledWith({ name: 'Qualidade' });
  });
});
