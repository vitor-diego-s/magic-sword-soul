import { Character } from '../../src/entities/Character';
import { CharacterRepositoryFake } from '../__mocks__/CharacterRepositoryFake';
import FindCharacterUseCase from '../../src/useCases/FindCharacter/FindCharacterUseCase';

const characterRepositoryFake = new CharacterRepositoryFake();
const sut = new FindCharacterUseCase(characterRepositoryFake);

describe('F3 - Ter os detalhes de um personagem específico', () => {
  test('Deve recuperar um personagem ao informar um id no formato válido', async () => {
    await expect(
      sut.execute('ff6c1a7a-52f7-425b-a7be-366157097358')
    ).resolves.toBeInstanceOf(Object);
  });

  test('Deve retornar um erro ao informar um id no formato inválido', async () => {
    await expect(
      sut.execute('ff6c1a7a-$%&#-425b-*()((-366157097358')
    ).rejects.toThrow();
  });

  test('Deve retornar um erro ao informar um uuid desconhecido', async () => {
    jest
      .spyOn(characterRepositoryFake, 'findById')
      .mockResolvedValueOnce(undefined);

    await expect(
      sut.execute('ff6c1a7a-52f7-425b-a7be-366157097358')
    ).rejects.toThrow();
  });
});
