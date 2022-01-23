export const COLORS = {
  RED: '#ff0000',
  GREEN:  '#00ff00',
  BLUE: '#0000ff',
  BLANK: '#000000'
};

export const states = {
  BLANK: COLORS.BLANK,
  ROCK: COLORS.RED,
  PAPER: COLORS.GREEN,
  SCISSORS: COLORS.BLUE,
};

// export interface Color {
//   r: number;
//   g: number;
//   b: number;
// }

class Cell {
  state: string;
  x: number;
  y: number;
  generation: number;
  color: string;

  constructor(x: number, y: number, generation: number, state ?: string, ) {
    this.state = state ?? states.BLANK;
    this.x = x;
    this.y = y;
    this.generation = generation;
    this.color = state ?? states.BLANK;
  }

  public setGeneration(generation: number) {
    this.generation = generation;
  }
}

export default Cell;
