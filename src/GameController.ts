import Cell from './Cell';
import { states } from './Cell';
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');
canvas.width = 700;
canvas.height = 500;
const redBtn = document.getElementById('red');
const greenBtn = document.getElementById('green');
const blueBtn = document.getElementById('blue');

const startBtn = document.getElementById('start');
const stepBtn = document.getElementById('step');

const fps = 50;
const fpsInterval = 1000 / fps; // Get interval in milliseconds

export enum STATUS {
  PAUSED,
  RUNNING,
}

const GRID = true;
const MOUSE_ALWAYS_ON = true;

class GameController {
  canvasWidth: number;
  canvasHeight: number;
  columnCount: number;
  rowCount: number;
  cellHeight: number;
  cellWidth: number;
  cells: Cell[][];
  mouseActive: boolean;
  mode: string;
  status: STATUS;
  frame: number;
  lastFrame: number;

  constructor() {
    // Constants
    this.canvasWidth = canvas.width;
    this.canvasHeight = canvas.height;
    this.columnCount = 30;
    this.rowCount = 30;
    this.cellWidth = this.canvasWidth / this.columnCount;
    this.cellHeight = this.canvasHeight / this.rowCount;

    // Game State
    this.cells = [];
    this.mouseActive = false;
    this.mode = states.BLANK; // Color to be used
    this.status = STATUS.PAUSED;
    this.frame = -1;
    this.lastFrame = 0;

    // Canvas Mouse Events
    canvas.addEventListener('click', (event) => {
      this.mouseActive = true;
      this.handleClick(event);
      this.mouseActive = false;
    });
    canvas.addEventListener('mousedown', () => (this.mouseActive = true));
    canvas.addEventListener('mouseup', () => (this.mouseActive = false));
    canvas.addEventListener('mouseout', () => (this.mouseActive = false));
    canvas.addEventListener('mousemove', this.handleClick);
    canvas.addEventListener('dragstart', () => (this.mouseActive = true));
    canvas.addEventListener('dragend', () => (this.mouseActive = false));

    // Btn events
    redBtn?.addEventListener('click', () => this.switchMode(states.ROCK));
    greenBtn?.addEventListener('click', () => this.switchMode(states.PAPER));
    blueBtn?.addEventListener('click', () => this.switchMode(states.SCISSORS));
    startBtn?.addEventListener('click', this.handleStartClick);
    stepBtn?.addEventListener('click', this.handleStep);

    // Create board and start render loop
    this.setUpBoard();
    this.render(0);
  }

  // Switch between different colors
  public switchMode = (newState: string) => {
    this.mode = newState;
  };

  public handleClick = (event: MouseEvent) => {
    if (
      !this.mouseActive ||
      (!MOUSE_ALWAYS_ON && this.status === STATUS.RUNNING) // TODO: remember why I did this
    )
      return;

    // Get which cell was clicked at and update it
    const { offsetX: clickX, offsetY: clickY } = event;
    const targetCellX = (clickX - (clickX % this.cellWidth)) / this.cellWidth;
    const targetCellY = (clickY - (clickY % this.cellHeight)) / this.cellHeight;
    this.cells[targetCellY][targetCellX].state = this.mode;
    this.cells[targetCellY][targetCellX].setGeneration(0);
  };

  private handleStartClick = () => {
    const btnLabel = document.getElementById('btn-label');
    if (!btnLabel) return;
    if (this.status === STATUS.PAUSED) {
      btnLabel.innerText = 'Pause';
      this.status = STATUS.RUNNING;
    } else {
      btnLabel.innerText = 'Start';
      this.status = STATUS.PAUSED;
    }
  };

  private handleStep = () => {
    this.status = STATUS.RUNNING;
    this.updateBoard();
    this.status = STATUS.PAUSED;
  };

  /**
   * Returns 1 if c1 beats c2,
   * returns 0 if draw
   * returns -1 if c2 beats c1
   * @param c1 cell1 state
   * @param c2 cell2 state
   */
  private compare = (c1: string, c2: string) => {
    if (c1 === states.BLANK) return -1;
    if (c2 === states.BLANK) return 1;
    if (c1 === c2) return 0;
    if (c1 === states.ROCK) {
      return c2 === states.SCISSORS ? 1 : -1;
    }
    if (c1 === states.PAPER) {
      return c2 === states.ROCK ? 1 : -1;
    }
    if (c1 === states.SCISSORS) {
      return c2 === states.PAPER ? 1 : -1;
    }
    return 1;
  };

  private _getNeighbors = (x: number, y: number, cells: Cell[][]) => {
    const startX = Math.max(0, x - 1);
    const startY = Math.max(0, y - 1);
    const endX = Math.min(this.columnCount, x + 2);
    const endY = Math.min(this.rowCount, y + 2);
    const counts = {
      rock: 0,
      paper: 0,
      scissors: 0,
    };

    const res = {
      total: 0,
      count: 0,
      type: states.BLANK,
    };

    for (let curY = startY; curY < endY; curY++) {
      for (let curX = startX; curX < endX; curX++) {
        if (
          (curY === y && curX === x) ||
          cells[curY][curX].state === states.BLANK
        ) {
          continue;
        }
        let cell = cells[curY][curX];
        let cellState = cell.state;
        res.total++;
        switch (cell.state) {
          case states.ROCK:
            counts.rock++;
            if (counts.rock > res.count) {
              res.count = counts.rock;
              res.type = cellState;
            }
            break;
          case states.PAPER:
            counts.paper++;
            if (counts.paper > res.count) {
              res.count = counts.paper;
              res.type = cellState;
            }
            break;
          case states.SCISSORS:
            counts.scissors++;
            if (counts.scissors > res.count) {
              res.count = counts.scissors;
              res.type = cellState;
            }
            break;
          default:
            continue;
        }
      }
    }
    return res;
  };

  public render = (time: number) => {
    if (this.status === STATUS.RUNNING && time - this.lastFrame >= fpsInterval) {
      this.lastFrame = time;
      this.updateBoard();
    }
    this.drawBoard();
    if (GRID) this.drawGrid();
    requestAnimationFrame(this.render);
  };

  private getBoardCopy = () => {
    return this.cells.map((row) =>
      row.map((i) => new Cell(i.x, i.y, i.generation, i.state))
    );
  };

  private updateBoard = () => {
    const board = this.getBoardCopy();
    if (this.status !== STATUS.RUNNING) return;
    for (let y = 0; y < this.rowCount; y++) {
      for (let x = 0; x < this.columnCount; x++) {
        const chosenNeighbor = this.getRandomNeighbor(x, y, board);
        const cell = board[y][x];
        if (
          this.compare(cell.state, chosenNeighbor.state) < 0 &&
          chosenNeighbor.generation < 9
        ) {
          if (this.cells[y][x].state === states.BLANK) {
            this.cells[y][x].generation = chosenNeighbor.generation + 1;
          } else {
            this.cells[y][x].generation = 0;
          }
          this.cells[y][x].state = chosenNeighbor.state;
        }
      }
    }
  };

  private setUpBoard = () => {
    for (let y = 0; y < this.rowCount; y++) {
      let cells = [];
      for (let x = 0; x < this.columnCount; x++) {
        cells.push(new Cell(x, y, 1));
      }
      this.cells.push(cells);
    }
  };

  public drawBoard = () => {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < this.rowCount; y++) {
      for (let x = 0; x < this.columnCount; x++) {
        let cell = this.cells[y][x];
        ctx.fillStyle = cell.state;
        let startX = this.cellWidth * x;
        let startY = this.cellHeight * y;
        ctx.fillRect(startX, startY, this.cellWidth, this.cellHeight);
      }
    }
  };

  private getRandomNeighbor = (
    cellX: number,
    cellY: number,
    cells: Cell[][]
  ) => {
    const startX = Math.max(0, cellX - 1);
    const startY = Math.max(0, cellY - 1);
    const endX = Math.min(this.columnCount - 1, cellX + 1);
    const endY = Math.min(this.rowCount - 1, cellY + 1);
    let randX = Math.ceil(Math.random() * (endX - startX) + startX);
    let randY = Math.ceil(Math.random() * (endY - startY) + startY);

    while (randX === cellX && randY === cellY) {
      randX = Math.floor(Math.random() * (endX - startX) + startX);
      randY = Math.floor(Math.random() * (endY - startY) + startY);
    }

    return cells[randY][randX];
  };

  private drawGrid = () => {
    if (!ctx || !GRID) return;
    for (let y = this.cellHeight; y < this.canvasHeight; y += this.cellHeight) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvasWidth, y);
      ctx.stroke();
    }
    for (let x = this.cellWidth; x < this.canvasWidth; x += this.cellWidth) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvasHeight);
      ctx.strokeStyle = '#aaaaaa';
      ctx.stroke();
    }
  };
}

export default GameController;
