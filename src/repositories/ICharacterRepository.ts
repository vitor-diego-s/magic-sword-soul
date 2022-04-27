import { Character } from '../entities/Character';

export interface ICharacterRepository {
  save(character: Character): Promise<void>;
  find(query: any): Promise<Character[] | any[]>;
  findById(id: string): Promise<Character | undefined>;
  findByName(name: string): Promise<Character | undefined>;
}