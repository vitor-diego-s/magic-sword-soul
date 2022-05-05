import { v4 } from 'uuid';
import Round from './Round';
import { Character } from './Character';
import { CharacterStatus } from '../shared/enums/Character';
import { ActionTypes, BattleStatus } from '../shared/enums/Battle';

export default class Battle {
  constructor(
    private players: Character[],
    private playersQuantity: number,
    private status?: BattleStatus,
    private rounds?: Round[],
    private id?: string
  ) {
    this.validateBattleConstraints();

    if (!status) {
      this.status = BattleStatus.Closed;
    }

    if (!id) {
      this.id = v4();
    }
  }

  get getId() {
    return this.id;
  }

  get getPlayers() {
    return this.players;
  }

  get getStatus() {
    return this.status;
  }

  set setStatus(status: BattleStatus) {
    this.status = status;
  }

  calculateAttack(id: string, lucky?: number): number {
    return this.calculateAttribute(ActionTypes.Attack, id);
  }

  calculateSpeed(id: string, lucky?: number): number {
    return this.calculateAttribute(ActionTypes.Speed, id);
  }

  calculateAttribute(method: ActionTypes, id: string) {
    const player = this.players.find((player) => player.getId === id);
    if (player) {
      const calculated = Math.floor(Math.random() * player[method]());
      console.log('calculating speed', { player, calculated });
      return calculated;
    }

    throw new Error(`The player ${id} was not found on this battle`);
  }

  validateBattleConstraints() {
    if (this.players.length < this.playersQuantity) {
      throw new Error(
        `This battle requires at least ${this.playersQuantity} characters`
      );
    }

    const deadCharacter = this.players.find(
      (player) => player.getStatus === CharacterStatus.Dead
    );

    if (deadCharacter) {
      throw new Error(`Only alive characters can join this battle`);
    }

    const duplicatedPlayer = this.players.find(
      (value) => this.players.indexOf(value) !== this.players.lastIndexOf(value)
    );

    if (duplicatedPlayer) {
      throw new Error(`Duplicated characters are not allowed on this battle`);
    }
  }
}
