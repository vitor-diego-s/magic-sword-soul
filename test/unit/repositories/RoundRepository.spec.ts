import Battle from '../../../src/entities/Battle';
import Round from '../../../src/entities/Round';

import { getAliveCharacters } from '../../__stubs__/PerformBattle';
import { MIN_BATTLE_CHARACTERS } from '../../../src/shared/constants/battlefield';
import RoundRepository from '../../../src/repositories/implementations/RoundRepository';

let repository: RoundRepository;

beforeEach(() => {
  repository = new RoundRepository();
});

describe('RoundRepository:', () => {
  test('save', async () => {
    const [playerOne, playerTwo] = getAliveCharacters();

    const battleOne = new Battle([playerOne, playerTwo], MIN_BATTLE_CHARACTERS);

    const lastRound = new Round(
      battleOne.getId,
      playerOne.getId,
      playerTwo.getId
    );

    const repoSaveSpy = jest.spyOn(repository, 'save');

    await repository.save(lastRound);

    expect(repoSaveSpy).toHaveReturnedTimes(1);
  });

  test('find', async () => {
    const [playerOne, playerTwo] = getAliveCharacters();

    const battleOne = new Battle([playerOne, playerTwo], MIN_BATTLE_CHARACTERS);
    const battleTwo = new Battle([playerOne, playerTwo], MIN_BATTLE_CHARACTERS);

    const repoSaveSpy = jest.spyOn(repository, 'save');
    const repoFindSpy = jest.spyOn(repository, 'find');

    const anotherRound = new Round(
      battleTwo.getId,
      playerOne.getId,
      playerTwo.getId
    );

    const roundOne = new Round(
      battleOne.getId,
      playerOne.getId,
      playerTwo.getId
    );

    const roundTwo = new Round(
      battleOne.getId,
      playerTwo.getId,
      playerOne.getId
    );

    await repository.save(roundOne);
    await repository.save(roundTwo);
    await repository.save(anotherRound);

    const rounds = await repository.find({
      battleId: battleOne.getId,
    });

    expect(rounds).toBeDefined();
    expect(rounds).toHaveLength(2);

    expect(repoSaveSpy).toBeCalledTimes(3);
    expect(repoFindSpy).toBeCalledTimes(1);
  });

  test('findById', async () => {
    const [playerOne, playerTwo] = getAliveCharacters();

    const battleOne = new Battle([playerOne, playerTwo], MIN_BATTLE_CHARACTERS);

    const repoSaveSpy = jest.spyOn(repository, 'save');
    const repoFindSpy = jest.spyOn(repository, 'findById');

    const lastRound = new Round(
      battleOne.getId,
      playerOne.getId,
      playerTwo.getId
    );

    await repository.save(lastRound);
    const foundRound = await repository.findById(lastRound.getId);

    expect(foundRound).toBeDefined();
    expect(foundRound!.getId).toBe(lastRound.getId);

    expect(repoSaveSpy).toBeCalledTimes(1);
    expect(repoFindSpy).toBeCalledTimes(1);
  });
});
