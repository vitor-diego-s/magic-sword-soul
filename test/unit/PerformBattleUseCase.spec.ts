import { UnprocessableException } from '../../src/shared/exceptions/UnprocessableException';
import { BadRequestException } from '../../src/shared/exceptions/BadRequestException';
import { NotFoundException } from '../../src/shared/exceptions/NotFoundException';

import PerformBattleUseCase from '../../src/useCases/PerformBattle/PerformBattleUseCase';
import { PerformRoundDTO } from '../../src/useCases/PerformBattle/PerformRoundDTO';

import { getAliveCharacters, battleStub } from '../__stubs__/PerformBattle';
import { CharacterUseCaseFake } from '../__mocks__/CharacterUseCaseFake';
import { BattleRepositoryFake } from '../__mocks__/BattleRepositoryFake';
import { RoundRepositoryFake } from '../__mocks__/RoundRepositoryFake';

import { IBattleState } from '../../src/shared/interfaces/IPerformBattle';

import Round from '../../src/entities/Round';
import { BattleStatus, RoundType } from '../../src/shared/enums/Battle';
import { CharacterStatus } from '../../src/shared/enums/Character';
import { IRoundState } from '../../src/shared/interfaces/IPerformRound';

const characterUseCaseFake = new CharacterUseCaseFake();
const battleRepositoryFake = new BattleRepositoryFake();
const roundRepositoryFake = new RoundRepositoryFake();

const sut = new PerformBattleUseCase(
  battleRepositoryFake,
  characterUseCaseFake,
  roundRepositoryFake
);

beforeEach(async () => {
  jest.clearAllMocks();
});

describe('F4 - Realizar o combate entre dois personagens', () => {
  describe('Deve inicializar uma batalha', () => {
    test('Deve criar uma nova batalha', async () => {
      const [playerOne, playerTwo] = getAliveCharacters();

      const currentBattle = await battleStub(sut, battleRepositoryFake, [
        playerOne,
        playerTwo,
      ]);

      expect(currentBattle).toBeDefined();
      expect(currentBattle?.getId).toBeDefined();
      expect(currentBattle?.getStatus).toBe(BattleStatus.Closed);

      expect(currentBattle?.getPlayers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: playerOne.getName,
            profession: playerOne.getProfession,
          }),
          expect.objectContaining({
            name: playerTwo.getName,
            profession: playerTwo.getProfession,
          }),
        ])
      );
    });

    test('Deve retornar um erro ao criar uma batalha com personagens inexistentes', async () => {
      // const battleRepoSpy = jest.spyOn(battleRepositoryFake, 'save');

      try {
        await sut.createBattle({
          players: [
            'fe21a511-955f-447b-8f80-d06196061284',
            '2c9160da-0fb9-4d2f-aec6-c0a6de41ae7f',
          ],
        });
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        // expect(battleRepoSpy).toHaveBeenCalledTimes(0);
      }
    });

    test('Deve abrir uma batalha existente', async () => {
      const [playerOne, playerTwo] = getAliveCharacters();

      const currentBattle = await battleStub(sut, battleRepositoryFake, [
        playerOne,
        playerTwo,
      ]);

      jest
        .spyOn(battleRepositoryFake, 'findById')
        .mockResolvedValueOnce(Promise.resolve(currentBattle));

      jest
        .spyOn(roundRepositoryFake, 'save')
        .mockResolvedValueOnce(Promise.resolve());

      jest.spyOn(currentBattle, 'calculateSpeed').mockReturnValueOnce(100);

      const battleRepoSpy = jest
        .spyOn(battleRepositoryFake, 'update')
        .mockResolvedValueOnce(Promise.resolve());

      const startedBattle = await sut.executeBattle(currentBattle.getId!);

      expect(startedBattle).toBeDefined();
      expect(battleRepoSpy).toHaveBeenCalledTimes(1);
      expect(startedBattle.getStarterPlayer).toBeDefined();
      expect(startedBattle.getStatus).toBe(BattleStatus.Active);
    });

    test('Deve retornar um erro ao abrir uma batalha inexistente', async () => {
      try {
        jest
          .spyOn(battleRepositoryFake, 'findById')
          .mockResolvedValueOnce(Promise.resolve(undefined));

        await sut.executeBattle('2c9160da-0fb9-4d2f-aec6-c0a6de41ae7f');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(NotFoundException);
      }
    });

    test('Deve definir qual personagem inicializará a batalha', async () => {
      const [playerOne, playerTwo] = getAliveCharacters();

      const currentBattle = await battleStub(sut, battleRepositoryFake, [
        playerOne,
        playerTwo,
      ]);

      jest.spyOn(currentBattle, 'calculateSpeed').mockReturnValueOnce(100);

      const [fastestPlayer] = sut.sortFasterPlayer(currentBattle);

      expect(fastestPlayer).toBeDefined();
      expect(fastestPlayer.id).toBe(currentBattle.getPlayers[0].getId);
      expect(fastestPlayer.id).not.toBe(currentBattle.getPlayers[1].getId);

      expect(fastestPlayer).toHaveProperty('id');
      expect(fastestPlayer).toHaveProperty('calculated');
    });

    test('Deve recalcular as velocidades de personagens no caso de empate', async () => {
      const [playerOne, playerTwo] = getAliveCharacters();

      const currentBattle = await battleStub(sut, battleRepositoryFake, [
        playerOne,
        playerTwo,
      ]);

      jest
        .spyOn(battleRepositoryFake, 'findById')
        .mockResolvedValueOnce(Promise.resolve(currentBattle));

      jest
        .spyOn(roundRepositoryFake, 'save')
        .mockResolvedValueOnce(Promise.resolve());

      const battleRepoSpy = jest
        .spyOn(battleRepositoryFake, 'update')
        .mockResolvedValueOnce(Promise.resolve());

      const sutSpy = jest.spyOn(sut, 'sortFasterPlayer');

      jest.spyOn(currentBattle, 'calculateSpeed').mockReturnValueOnce(2);

      // TODO: validate recursive strategy toHaveBeenCalledTimes(x)
      const startedBattle = await sut.executeBattle(currentBattle.getId!);

      expect(sutSpy).toHaveBeenCalled();
      expect(battleRepoSpy).toHaveBeenCalledTimes(1);
      expect(startedBattle.getStarterPlayer).toBeDefined();
    });

    test('Deve retornar um erro ao inicializar com o personagem incorreto', async () => {
      const [playerOne, playerTwo] = getAliveCharacters();

      const currentBattle = await battleStub(
        sut,
        battleRepositoryFake,
        [playerOne, playerTwo],
        BattleStatus.Active
      );

      const props: PerformRoundDTO = {
        offensive: playerTwo.getId,
        defensive: playerOne.getId,
        battleId: currentBattle!.getId,
      };

      expect(currentBattle.getRounds).toHaveLength(0);

      const lastRound = new Round(
        currentBattle.getId,
        playerOne.getId,
        playerTwo.getId
      );

      currentBattle.setRounds = {
        id: lastRound.getId,
        type: RoundType.Initial,
      };

      currentBattle.setStarterPlayer = playerOne.getId;

      jest
        .spyOn(battleRepositoryFake, 'findById')
        .mockResolvedValueOnce(Promise.resolve(currentBattle));

      jest
        .spyOn(roundRepositoryFake, 'findById')
        .mockResolvedValueOnce(Promise.resolve(undefined));

      await expect(sut.executeRound(props)).rejects.toThrowError(
        `This initial turn is offensive for ${playerOne.getId} player`
      );
    });
  });

  describe('Deve conduzir uma batalha', () => {
    test('Deve executar um turno batalha', async () => {
      const [playerOne, playerTwo] = getAliveCharacters();

      const currentBattle = await battleStub(
        sut,
        battleRepositoryFake,
        [playerOne, playerTwo],
        BattleStatus.Active
      );

      const props: PerformRoundDTO = {
        offensive: playerTwo.getId,
        defensive: playerOne.getId,
        battleId: currentBattle!.getId,
      };

      expect(currentBattle.getRounds).toHaveLength(0);

      const lastRound = new Round(
        currentBattle.getId,
        playerOne.getId,
        playerTwo.getId
      );

      currentBattle.setRounds = {
        id: lastRound.getId,
        type: RoundType.OnGoing,
      };

      currentBattle.setStarterPlayer = playerOne.getId;

      jest
        .spyOn(battleRepositoryFake, 'findById')
        .mockResolvedValueOnce(Promise.resolve(currentBattle));

      jest
        .spyOn(sut, 'getLastMove')
        .mockReturnValueOnce(Promise.resolve(lastRound));

      jest
        .spyOn(characterUseCaseFake, 'updateCharacterById')
        .mockResolvedValue(Promise.resolve());

      const battleRepoSpy = jest
        .spyOn(battleRepositoryFake, 'update')
        .mockResolvedValueOnce(Promise.resolve());

      const roundRepoSpy = jest
        .spyOn(roundRepositoryFake, 'save')
        .mockResolvedValueOnce(Promise.resolve());

      const { round } = await sut.executeRound(props);

      expect(round).toBeDefined();
      expect(roundRepoSpy).toHaveBeenCalledTimes(1);
      expect(battleRepoSpy).toHaveBeenCalledTimes(1);
      expect(round.getCalculatedAttack).toBeDefined();
      expect(round.getCalculatedDamage).toBeDefined();
      expect(round.getCalculatedSpeed.offensive).not.toBeDefined();
      expect(round.getCalculatedSpeed.defensive).not.toBeDefined();
    });

    describe('Deve garantir a ordem das jogadas com base na velocidade_calculada inicial', () => {
      test('Deve retornar o turno de batalha mais recente', async () => {
        const [playerOne, playerTwo] = getAliveCharacters();

        const currentBattle = await battleStub(sut, battleRepositoryFake, [
          playerOne,
          playerTwo,
        ]);

        const firstRound = new Round(
          currentBattle.getId,
          playerOne.getId,
          playerTwo.getId
        );

        const secondRound = new Round(
          currentBattle.getId,
          playerTwo.getId,
          playerOne.getId
        );

        jest
          .spyOn(roundRepositoryFake, 'findById')
          .mockResolvedValueOnce(Promise.resolve(secondRound));

        currentBattle.setRounds = {
          id: firstRound.getId,
          type: RoundType.OnGoing,
        };

        currentBattle.setRounds = {
          id: secondRound.getId,
          type: RoundType.OnGoing,
        };

        expect(currentBattle.getRounds).toHaveLength(2);

        const sutSpy = jest.spyOn(sut, 'getLastMove');
        const lastMove = await sut.getLastMove(currentBattle);

        expect(lastMove).toBe(secondRound);
        expect(sutSpy).toBeCalledTimes(1);
      });

      test('Deve retornar um erro ao executar um turno fora da ordem esperada', async () => {
        const [playerOne, playerTwo] = getAliveCharacters();

        const currentBattle = await battleStub(sut, battleRepositoryFake, [
          playerOne,
          playerTwo,
        ]);

        const props: PerformRoundDTO = {
          offensive: playerOne.getId,
          defensive: playerTwo.getId,
          battleId: currentBattle!.getId,
        };

        const currentRound = new Round(
          currentBattle.getId,
          playerOne.getId,
          playerTwo.getId
        );

        currentBattle.setRounds = {
          id: currentRound.getId,
          type: RoundType.OnGoing,
        };

        currentBattle.setStarterPlayer = playerOne.getId;

        jest
          .spyOn(battleRepositoryFake, 'findById')
          .mockResolvedValueOnce(Promise.resolve(currentBattle));

        try {
          await sut.executeRound(props);
        } catch (error) {
          expect(error).toBeInstanceOf(UnprocessableException);
          expect(error).toHaveProperty('message');
          // expect(error).toMatchObject(
          //   expect.objectContaining({
          //     status: 400,
          //     message: `This turn is defensive for ${playerOne.getId} player`,
          //   })
          // );
        }
      });

      test('Deve retornar um erro ao executar um turno em uma batalha não inicializada', async () => {
        const [playerOne, playerTwo] = getAliveCharacters();

        const currentBattle = await battleStub(sut, battleRepositoryFake, [
          playerOne,
          playerTwo,
        ]);

        currentBattle.setStatus = BattleStatus.Closed;
        expect(currentBattle.getStatus).toBe(BattleStatus.Closed);

        jest
          .spyOn(battleRepositoryFake, 'findById')
          .mockResolvedValueOnce(Promise.resolve(currentBattle));

        const props: PerformRoundDTO = {
          offensive: playerOne.getId,
          defensive: playerTwo.getId,
          battleId: currentBattle!.getId,
        };

        try {
          await sut.executeRound(props);
        } catch (error) {
          expect(error).toBeDefined();
          expect(error).toBeInstanceOf(UnprocessableException);
        }
      });
    });

    test('Deve subtrair os pontos de vida de um personagem após o dano ser realizado', async () => {
      const [defensivePlayer, offensivePlayer] = getAliveCharacters();

      const currentBattle = await battleStub(sut, battleRepositoryFake, [
        defensivePlayer,
        offensivePlayer,
      ]);

      const originLife = defensivePlayer.getLife;

      const calculatedAttack = currentBattle.calculateAttack(
        offensivePlayer.getId
      );

      const remainingLife = currentBattle.executeDamage(
        calculatedAttack,
        defensivePlayer.getId
      );

      expect(remainingLife).toBeDefined();
      expect(remainingLife).toBeLessThan(originLife);
    });
  });

  describe('Deve finalizar uma batalha', () => {
    test('Deve identificar a morte de um personagem', async () => {
      const [defensivePlayer, offensivePlayer] = getAliveCharacters();

      const currentBattle = await battleStub(
        sut,
        battleRepositoryFake,
        [defensivePlayer, offensivePlayer],
        BattleStatus.Active
      );

      currentBattle.setStarterPlayer = offensivePlayer.getId;

      const props: PerformRoundDTO = {
        offensive: offensivePlayer.getId,
        defensive: defensivePlayer.getId,
        battleId: currentBattle!.getId,
      };

      jest
        .spyOn(battleRepositoryFake, 'findById')
        .mockResolvedValueOnce(Promise.resolve(currentBattle));

      jest
        .spyOn(battleRepositoryFake, 'update')
        .mockResolvedValueOnce(Promise.resolve());

      jest
        .spyOn(roundRepositoryFake, 'save')
        .mockResolvedValue(Promise.resolve());

      jest
        .spyOn(characterUseCaseFake, 'updateCharacterById')
        .mockResolvedValue(Promise.resolve());

      const calculatedAttackSpy = jest
        .spyOn(currentBattle, 'calculateAttack')
        .mockReturnValueOnce(100);

      const executeDamageSpy = jest.spyOn(currentBattle, 'executeDamage');
      const sutSpy = jest.spyOn(sut, 'setBattleState');

      const { battle } = await sut.executeRound(props);

      const damagedPlayer = battle.getPlayers.find(
        (player) => player.getId === defensivePlayer.getId
      );

      expect(battle).toBeDefined();
      expect(sutSpy).toHaveBeenCalledTimes(1);
      expect(calculatedAttackSpy).toHaveLastReturnedWith(100);

      expect(executeDamageSpy).toBeCalledTimes(1);

      expect(damagedPlayer!.getLife).toBe(0);
      expect(damagedPlayer!.getStatus).toBe(CharacterStatus.Dead);
      expect(currentBattle.getStatus).toBe(BattleStatus.Finished);
    });

    test('Deve atualizar os pontos de vida de um personagem ao concluir', async () => {
      const [defensivePlayer, offensivePlayer] = getAliveCharacters();

      const currentBattle = await battleStub(
        sut,
        battleRepositoryFake,
        [defensivePlayer, offensivePlayer],
        BattleStatus.Active
      );

      const currentRound = new Round(
        currentBattle.getId,
        offensivePlayer.getId,
        defensivePlayer.getId
      );

      jest
        .spyOn(battleRepositoryFake, 'update')
        .mockResolvedValueOnce(Promise.resolve());

      jest
        .spyOn(roundRepositoryFake, 'save')
        .mockResolvedValue(Promise.resolve());

      const roundState: IRoundState = {
        calculatedAttack: 100,
        calculatedDamage: defensivePlayer.getLife - 100,
        executedDamage: {
          id: defensivePlayer.getId,
          calculated: defensivePlayer.getLife - 100,
        },
      };

      const battleState: IBattleState = {
        battle: currentBattle,
        round: currentRound,
      };

      const characterRepoSpy = jest
        .spyOn(characterUseCaseFake, 'updateCharacterById')
        .mockResolvedValue(Promise.resolve());

      defensivePlayer.setStatus = CharacterStatus.Dead;
      const sutSpy = jest.spyOn(sut, 'setBattleState');
      await sut.setBattleState(battleState, roundState);

      expect(sutSpy).toHaveBeenCalledTimes(1);
      expect(characterRepoSpy).toHaveBeenCalledTimes(2);
      expect(currentBattle.getStatus).toBe(BattleStatus.Finished);
      expect(sutSpy).toHaveBeenCalledWith(battleState, roundState);
    });
  });
});
