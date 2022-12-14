import request from 'supertest';
import app from '../../src/index';

describe('Criação de personagens', () => {
  describe('POST /character', () => {
    test('Deve retornar o status code 201 ao informar os dados corretos', async () => {
      const result = await request(app).post('/character').send({
        name: 'Gusnmg_Hujn',
        profession: 'warrior',
      });

      expect(result.statusCode).toEqual(201);
      expect(result.body).toHaveProperty('id');
      expect(result.body).toMatchObject(
        expect.objectContaining({
          life: 20,
          skill: 5,
          strength: 10,
          intelligence: 5,
          name: 'Gusnmg_Hujn',
          profession: 'warrior',
        })
      );
    });

    test('Deve retornar o status code 400 ao informar os dados incorretos', async () => {
      const result = await request(app).post('/character').send({
        name: 'Gusnmg_Hujn',
        profession: 'witcher',
      });

      expect(result.statusCode).toEqual(400);
    });

    test('Deve retornar o status code 404 ao informar o endereço incorreto', async () => {
      const result = await request(app).post('/').send({
        name: 'Gusnmg_Hujn',
        profession: 'witcher',
      });

      expect(result.statusCode).toEqual(404);
    });
  });
});
