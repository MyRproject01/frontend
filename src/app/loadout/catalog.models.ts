export interface Character {
  id: number;
  name: string;
  health: number;
  attackSpeed: number;
  range: number;
  damage: number;
  shield: number;
  description?: string;
  updatedAt: string;
  createdAt: string;
}

export interface Weapon {
  id: number;
  name: string;
  price: number;
  attackSpeed: number;
  range: number;
  damage: number;
  description?: string;
}

export interface Item {
  id: number;
  name: string;
  description?: string;
}

export interface Enemy {
  id: number;
  name: string;
  health: number;
  speed: number;
  damage: number;
  difficulty: number;
  description?: string;
}
