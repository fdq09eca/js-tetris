class Utils {
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    static asInt(float) {
        return Math.floor(float);
    }
}

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('app');
        this.ctx = this.canvas.getContext('2d');
        this.onInit();
        this.grid = new Grid(0, 0, this.canvas.width, this.canvas.height, 30);
    }

    get spawnPosition() {
        return new Point(0, Utils.asInt(this.canvas.width / 2) - 1);
    }

    onInit(w = 300, h = 600) {
        this.canvas.width = w;
        this.canvas.height = h;
        this.ctx.fillStyle = 'cyan';
        this.ctx.fillRect(0, 0, w, h);
        window.addEventListener('keydown', this.onKeyDown);
    }

    onKeyDown(e) {
        switch (e.key) {
            case 'ArrowLeft':
                console.log('left');
                break;
            case 'ArrowRight':
                console.log('right');
                break;
            case 'ArrowDown':
                console.log('down');
                break;
            case 'ArrowUp':
                console.log('up');
                break;
            default:
                break;
        }
    }


    draw() {
        const step = this.grid.cellSize;
        const sp_y = this.spawnPosition;
        const p = Piece.create(this.spawnPosition.y, this.spawnPosition.x, 'L')
        p.rotate();
        p.rotate();
        p.rotate();
        p.rotate();
        p.move(0, step);
        p.move(0, step);
        p.move(0, step);
        p.move(0, step);
        // p.move(step, 0);
        // p.move(-step, 0);



        p.shape.forEach((row, i) => {
            row.forEach((value, j) => {
                if (value === 1) {
                    const x = j * this.grid.cellSize + p.x;
                    const y = i * this.grid.cellSize + p.y;
                    const cell = this.grid.getCelllAt(x, y);
                    if (cell == null)
                        return;
                    cell.color = p.color;
                    cell.value = value;
                }
            })
        })

        this.grid.getCelllAt(99, 30).color = 'red';
        this.grid.draw(this.ctx);
    }


}

class Cell {
    constructor(x, y, size = 30, color = 'white', borderWidth = 2, boarderColor = 'black') {
        this.x = x;
        this.y = y;
        this.size = size;
        this.borderWidth = borderWidth;
        this.boarderColor = boarderColor;
        this.color = color;
        this.value = 0;
    }

    _drawBoarder(ctx) {
        if (this.borderWidth <= 0) return;
        ctx.fillStyle = this.boarderColor;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }

    draw(ctx) {
        this._drawBoarder(ctx);
        if (this.value === 0)
            ctx.fillStyle = 'grey';
        else
            ctx.fillStyle = this.color;

        ctx.fillRect(
            this.x + this.borderWidth,
            this.y + this.borderWidth,
            this.size - this.borderWidth * 2,
            this.size - this.borderWidth * 2
        );
    }
}

class Grid {
    constructor(x, y, w, h, cellSize = 30) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.cellSize = cellSize;

        this.cells = [];
        this._init();
    }

    get nRow() {
        return Math.floor(this.h / this.cellSize);
    }

    get nCol() {
        return Math.floor(this.w / this.cellSize);
    }




    getCelllAt(x, y) {
        const row = Math.floor((y - this.y) / this.cellSize);
        const col = Math.floor((x - this.x) / this.cellSize);

        if (row < 0 || row >= this.nRow
            || col < 0 || col >= this.nCol) {
            return null;
        }
        const i = row * Math.floor(this.w / this.cellSize) + col
        return this.cells[i];
    }

    _init() {
        const nCells = this.nCol * this.nRow;

        for (let i = 0; i < nCells; i++) {
            const row = i % this.nCol;
            const col = Math.floor(i / this.nCol)

            const y = this.y + row * this.cellSize;
            const x = this.x + col * this.cellSize;

            this.cells.push(new Cell(y, x));
        }
    }

    draw(ctx) {
        this.cells.forEach(cell => cell.draw(ctx));
    }
}

class Piece {
    constructor(x, y, color = 'cyan') {
        this.x = x;
        this.y = y;
        this.shape = null;
        this.color = color;
    }

    move(dx, dy) {
        this.x += dx;
        this.y += dy;
    }





    rotate() {
        const nRow = this.shape.length;
        console.assert(nRow > 0);

        const nCol = this.shape[0].length;
        const rotated = new Array(nRow).fill(0).map(() => {
            return new Array(nCol).fill(0)
        });

        for (let r = 0; r < nRow; r++) {
            for (let c = 0; c < nCol; c++) {
                rotated[c][nRow - r - 1] = this.shape[r][c];
            }
        }

        this.shape = rotated;
    }

    static create(x, y, pieceType = 'I') {
        const p = new Piece(x, y, 'cyan');

        switch (pieceType) {
            case 'I': {
                p.shape = [
                    [0, 1, 0, 0],
                    [0, 1, 0, 0],
                    [0, 1, 0, 0],
                    [0, 1, 0, 0],
                ];
                p.color = 'cyan';
            } return p;

            case 'J': {

                p.shape = [
                    [0, 1, 0],
                    [0, 1, 0],
                    [1, 1, 0],
                ];
                p.color = 'blue';
            } return p;

            case 'L': {

                p.shape = [
                    [0, 1, 0],
                    [0, 1, 0],
                    [0, 1, 1],
                ];
                p.color = 'orange';
            } return p;


            case 'O': {
                p.shape = [
                    [1, 1],
                    [1, 1],
                ];
                p.color = 'yellow';
            } return p;

            case 'T': {
                p.shape = [
                    [1, 1, 1],
                    [0, 1, 0],
                    [0, 0, 0],
                ];
                p.color = 'purple';
            } return p;

            case 'S': {
                p.shape = [
                    [0, 1, 1],
                    [1, 1, 0],
                    [0, 0, 0],
                ];
                p.color = 'green';
            } return p;

            case 'Z': {
                p.shape = [
                    [1, 1, 0],
                    [0, 1, 1],
                    [0, 0, 0],
                ];
                p.color = 'red';
            } return p;

            default:
                throw new Error('Invalid piece type');
        }


    }

}


// main

const g = new Game()
g.onInit()
g.draw()
