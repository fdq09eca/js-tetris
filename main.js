class MyColor {
    constructor(r, g, b, a = 1) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    clone() {
        return new MyColor(this.r, this.g, this.b, this.a);
    }

    toString() {
        return `rgba(${this.r},${this.g},${this.b},${this.a})`;
    }
}

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

    static get WIDTH() {
        return 300;
    }

    static get HEIGHT() {
        return 600;
    }

    constructor() {
        this.initCanvas();
        this.init()
    }

    init() {
        const w = Game.WIDTH;
        const h = Game.HEIGHT;


        this.initCanvas(w, h);
        this.ctx = this.canvas.getContext('2d');

        this.reset();

        window.removeEventListener('keydown', this.onKeyDown.bind(this), false);
        window.addEventListener('keydown', this.onKeyDown.bind(this), false);
    }

    reset() {
        console.log('reset');
        const w = Game.WIDTH;
        const h = Game.HEIGHT;

        // this.ctx.fillStyle = 'cyan';
        // this.ctx.fillRect(0, 0, w, h);

        this.isGameOver = false;
        this.grid = new Grid(0, 0, w, h, 30);
        this.currentPiece = null;

    }

    initCanvas(w, h) {
        this.canvas = document.getElementById('app');
        this.canvas.width = w;
        this.canvas.height = h;
    }

    get spawnPosition() {
        const sx = this.grid.x + Utils.asInt(this.canvas.width / 2) - this.grid.cellSize
        const sy = -this.stepSize
        // const sy = this.step * 12
        return new Point(sx, sy);
    }

    

    

    isCollided(piece) {
        if (piece == null) return false


        for (let i in piece.shape) {
            const c = piece.shape[i];
            for (let j in c) {
                if (c[j] > 0) {
                    const x = piece.x + j * this.stepSize;
                    const y = piece.y + i * this.stepSize;

                    if (y >= this.grid.h) {
                        if (this.currentPiece === piece) {
                            this.isGameOver = true;
                        }
                        return true;
                    }


                    const cell = this.grid.getCelllAt(x, y);
                    if (cell != null && cell.value > 0) {
                        return true;
                    }
                }
            }
        }
        return false
    }

    get stepSize() {
        return this.grid.cellSize;
    }

    onCollided() {
        if (this.currentPiece == null) return

        this.currentPiece.move(0, this.stepSize);
        for (let i in this.currentPiece.shape) {
            const c = this.currentPiece.shape[i];
            for (let j in c) {
                if (c[j] > 0) {
                    const x = this.currentPiece.x + j * this.stepSize;
                    const y = this.currentPiece.y + i * this.stepSize;
                    const cell = this.grid.getCelllAt(x, y);
                    cell.color = this.currentPiece.color;
                    cell.value = c[j];

                }
            }
            this.currentPiece = null;
        }
    }

    update() {
        this.spawnPiece();

        this.currentPiece.move(0, this.stepSize);
        if (this.isCollided(this.currentPiece)) {

            if (this.isGameOver) {
                this.onGameOver();
            }

        }
    }

    onGameOver() {
        this.currentPiece.move(0, -this.stepSize);
        this.currentPiece.boarderColor = 'white';
        // clearInterval(this.intervalId);
    }

    onKeyDown(ev) {

        switch (ev.code) {
            case 'ArrowLeft':
                this.currentPiece.move(-this.grid.cellSize, 0);
                break;
            case 'ArrowRight':
                this.currentPiece.move(this.grid.cellSize, 0);
                console.log('right');
                break;
            case 'ArrowDown':
                this.currentPiece.move(0, this.grid.cellSize);
                console.log('down');
                break;
            case 'ArrowUp':
            case 'ControlLeft':
            case 'ControlRight':
                this.currentPiece.rotate();
                break;
            case 'Space':
                this.dropCurrentPiece();
                console.log('space');
                break;
            case 'Escape':
                this.reset()
                this.run()
                break;
            default:
                console.log(ev)
                break;
        }
    }

    spawnPiece() {
        if (this.currentPiece != null) return


        const i = Utils.randomInt(0, Piece.pieceTypes.length - 1);
        const type = Piece.pieceTypes[i];
        this.currentPiece = Piece.create(this.spawnPosition.x, this.spawnPosition.y, type);

        // this.currentPiece.y = -this.step * this.currentPiece.nRow();
    }

    dropCurrentPiece() {
        throw new Error('Not implemented');
    }

    drawGhostPiece() {
        const p = this.currentPiece.clone();
        

        p.color.a = 0.3;
        p.boarderColor.a = 0.3;
        p.x = this.currentPiece.x
        p.y = this.grid.h

        while (this.isCollided(p)) {
            p.move(0, -this.stepSize);
        }



        p.draw(this.ctx, this.grid.cellSize);
    }

    draw() {
        this.grid.draw(this.ctx);
        this.drawGhostPiece(this.currentPiece);
        this.currentPiece.draw(this.ctx, this.grid.cellSize);
    }

    run() {
        if (this.intervalId != null) {
            clearInterval(this.intervalId);
        }
        
        this.intervalId = setInterval(
            () => {
                this.update();
                this.draw();
                if (this.isGameOver) {
                    clearInterval(this.intervalId);
                }
            }, 500
        );
    }
}

class Cell {
    constructor(x, y, size = 30, color = 'white', borderWidth = 2, boarderColor = 'black', val = 0) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.borderWidth = borderWidth;
        this.boarderColor = boarderColor;
        this.color = color;
        this.value = val;
    }

    draw(ctx) {
        Cell.s_draw(ctx, this.x, this.y, this.size, this.color, this.borderWidth, this.boarderColor);
    }

    static s_draw(ctx, x, y, size, color = 'white', borderWidth = 2, boarderColor = 'black') {

        if (borderWidth > 0) {
            ctx.fillStyle = boarderColor;
            ctx.fillRect(x, y, size, size);
        }

        ctx.fillStyle = color;
        ctx.fillRect(
            x + borderWidth,
            y + borderWidth,
            size - borderWidth * 2,
            size - borderWidth * 2);

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
        this.init();
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



    init(bg_color = 'gray') {
        const nCells = this.nCol * this.nRow;

        for (let i = 0; i < nCells; i++) {
            const row = i % this.nCol;
            const col = Math.floor(i / this.nCol)

            const x = this.x + row * this.cellSize;
            const y = this.y + col * this.cellSize;
            const c = new Cell(x, y, this.cellSize)
            c.color = bg_color
            this.cells.push(c);

        }
    }

    draw(ctx) {
        this.cells.forEach(cell => cell.draw(ctx));
    }
}

class Piece {

    static get pieceTypes() {
        return ['I', 'J', 'L', 'O', 'T', 'S', 'Z'];
    }

    constructor(x, y, color = 'cyan') {
        this.x = x;
        this.y = y;
        this.type = null;
        this.shape = null;
        this.color = color;
        this.boarderColor = new MyColor(0, 0, 0, 1);
        this.borderWidth = 2
    }

    clone() {
        const p = new Piece(this.x, this.y, this.color.clone());
        p.shape = this.shape.map(row => row.map(v => v));
        return p;
    }

    nRow() {
        return this.shape.length;
    }

    nCol() {
        if (this.shape.length == 0) return 0;
        return this.shape[0].length;
    }

    draw(ctx, cellSize) {
        this.shape.forEach((row, i) => {
            row.forEach((value, j) => {
                if (value === 1) {
                    const x = j * cellSize + this.x;
                    const y = i * cellSize + this.y;
                    Cell.s_draw(ctx,
                        x,
                        y,
                        cellSize,
                        this.color.toString(),
                        this.borderWidth,
                        this.boarderColor.toString());
                }
            })
        })
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
                p.color = new MyColor(0, 255, 255, 1);
            } break;

            case 'J': {
                p.type = 'J';
                p.shape = [
                    [0, 1, 0],
                    [0, 1, 0],
                    [1, 1, 0],
                ];
                p.color = new MyColor(0, 0, 255, 1);
            } break;

            case 'L': {
                p.shape = [
                    [0, 1, 0],
                    [0, 1, 0],
                    [0, 1, 1],
                ];
                p.color = new MyColor(255, 165, 0, 1);
            } break;


            case 'O': {
                p.shape = [
                    [1, 1],
                    [1, 1],
                ];
                p.color = new MyColor(255, 255, 0, 1);

            } break;

            case 'T': {
                p.shape = [
                    [1, 1, 1],
                    [0, 1, 0],
                    [0, 0, 0],
                ];
                p.color = new MyColor(128, 0, 128, 1);
            } break;

            case 'S': {
                p.shape = [
                    [0, 1, 1],
                    [1, 1, 0],
                    [0, 0, 0],
                ];
                p.color = new MyColor(0, 255, 0, 1)
            } break;

            case 'Z': {
                p.shape = [
                    [1, 1, 0],
                    [0, 1, 1],
                    [0, 0, 0],
                ];
                p.color = new MyColor(255, 0, 0, 1)
            } break;

            default:
                throw new Error('Invalid piece type');
        }

        p.type = pieceType;
        return p;


    }

}

// main
const g = new Game()
g.run()