import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { ACCOUNT_REPOSITORY } from '../src/accounts/domain/account.repository.js';
import { SqliteAccountRepository } from '../src/accounts/infrastructure/sqlite-account.repository.js';
import { AppModule } from '../src/app.module.js';

describe('AccountsController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ACCOUNT_REPOSITORY)
      .useFactory({
        factory: () => new SqliteAccountRepository(':memory:'),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /accounts retorna [] cuando el catálogo está vacío', async () => {
    await request(app.getHttpServer()).get('/accounts').expect(200).expect([]);
  });

  it('crea la jerarquía completa (1 -> 11 -> 1105 -> 110505), hereda naturaleza y consulta el árbol anidado', async () => {
    const server = app.getHttpServer();

    await request(server)
      .post('/accounts')
      .send({ code: '1', name: 'Activo', nature: 'DEBITO' })
      .expect(201);

    await request(server)
      .post('/accounts')
      .send({ code: '2', name: 'Pasivo', nature: 'CREDITO' })
      .expect(201);

    await request(server)
      .post('/accounts')
      .send({ code: '11', name: 'Disponible' })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          code: '11',
          name: 'Disponible',
          level: 'GRUPO',
          nature: 'DEBITO',
          parentCode: '1',
          allowsMovements: true,
          children: [],
        });
      });

    await request(server)
      .post('/accounts')
      .send({ code: '1105', name: 'Caja' })
      .expect(201);

    await request(server)
      .post('/accounts')
      .send({ code: '110505', name: 'Caja general' })
      .expect(201);

    const treeResponse = await request(server).get('/accounts').expect(200);

    expect(treeResponse.body).toEqual([
      {
        code: '1',
        name: 'Activo',
        level: 'CLASE',
        nature: 'DEBITO',
        parentCode: null,
        allowsMovements: false,
        children: [
          {
            code: '11',
            name: 'Disponible',
            level: 'GRUPO',
            nature: 'DEBITO',
            parentCode: '1',
            allowsMovements: false,
            children: [
              {
                code: '1105',
                name: 'Caja',
                level: 'CUENTA',
                nature: 'DEBITO',
                parentCode: '11',
                allowsMovements: false,
                children: [
                  {
                    code: '110505',
                    name: 'Caja general',
                    level: 'SUBCUENTA',
                    nature: 'DEBITO',
                    parentCode: '1105',
                    allowsMovements: true,
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        code: '2',
        name: 'Pasivo',
        level: 'CLASE',
        nature: 'CREDITO',
        parentCode: null,
        allowsMovements: true,
        children: [],
      },
    ]);
  });

  it('rechaza peticiones inválidas con 400, duplicados con 409 y padre/naturaleza inconsistente con 422', async () => {
    const server = app.getHttpServer();

    await request(server)
      .post('/accounts')
      .send({ code: '1A', name: 'No numérico', nature: 'DEBITO' })
      .expect(400);

    await request(server)
      .post('/accounts')
      .send({ code: '110', name: 'Longitud 3 inválida', nature: 'DEBITO' })
      .expect(400);

    await request(server)
      .post('/accounts')
      .send({ code: '1', name: 'Clase sin naturaleza' })
      .expect(400);

    await request(server)
      .post('/accounts')
      .send({ code: '11', name: 'Sin padre existente' })
      .expect(422);

    await request(server)
      .post('/accounts')
      .send({ code: '1', name: 'Activo', nature: 'DEBITO' })
      .expect(201);

    await request(server)
      .post('/accounts')
      .send({ code: '1', name: 'Duplicado', nature: 'DEBITO' })
      .expect(409);

    await request(server)
      .post('/accounts')
      .send({ code: '11', name: 'Naturaleza opuesta', nature: 'CREDITO' })
      .expect(422);
  });

  it('DELETE /accounts/:code rechaza cuentas con hijas (409), inexistentes (404) y elimina hojas (204)', async () => {
    const server = app.getHttpServer();

    await request(server).delete('/accounts/9').expect(404);

    await request(server)
      .post('/accounts')
      .send({ code: '1', name: 'Activo', nature: 'DEBITO' })
      .expect(201);
    await request(server)
      .post('/accounts')
      .send({ code: '11', name: 'Disponible' })
      .expect(201);

    await request(server).delete('/accounts/1').expect(409);

    await request(server).delete('/accounts/11').expect(204);

    const treeAfterDelete = await request(server).get('/accounts').expect(200);
    expect(treeAfterDelete.body).toEqual([
      {
        code: '1',
        name: 'Activo',
        level: 'CLASE',
        nature: 'DEBITO',
        parentCode: null,
        allowsMovements: true,
        children: [],
      },
    ]);
  });
});
