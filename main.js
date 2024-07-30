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

    static sum(arr) {
        return arr.reduce((acc, val) => acc + val, 0)
    }

    static randomInt(min, max) {
        return Utils.asInt(Math.random() * (max - min + 1) + min);
    }

    static asInt(float) {
        return Math.trunc(float);
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

    static get FPS() {
        return 60;
    }

    static get DROP_SPEED() {
        return 1;
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
        const w = Game.WIDTH;
        const h = Game.HEIGHT;

        this.isGameOver = false;
        this.grid = new Grid(0, 0, w, h, 30);
        this.currentPiece = null;
        this.shadowPiece = null;

    }

    initCanvas(w, h) {
        this.canvas = document.getElementById('app');
        this.canvas.width = w;
        this.canvas.height = h;
    }

    spawnPosition(piece) {
        if (piece == null)
            return null
        const sx = this.grid.x + Utils.asInt(this.canvas.width / 2) - this.grid.cellSize
        let yOffset = 0
        for (let i = 0; i < piece.shape.length; i++) {
            const r = piece.shape[i]
            const rSum = Utils.sum(r)
            if (rSum > 0) {
                yOffset = i + 1
            }
        }

        const sy = -this.stepSize * yOffset;
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
                        // if (this.currentPiece === piece) {
                        //     this.isGameOver = true;
                        // }
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

        this.currentPiece.move(0, -this.stepSize);

        if (this.currentPiece.y < 0) {
            console.log("GAME OVER!!")
            this.isGameOver = true;
            this.onGameOver();
            return
        }

        for (let r = 0; r < this.currentPiece.shape.length; r++) {
            for (let c = 0; c < this.currentPiece.shape[r].length; c++) {
                const v = this.currentPiece.shape[r][c]
                if (v > 0) {
                    const x = this.currentPiece.x + c * this.stepSize;
                    const y = this.currentPiece.y + r * this.stepSize;
                    const cell = this.grid.getCelllAt(x, y);
                    cell.color = this.currentPiece.color;
                    cell.value = 1;
                }
            }
        }


        this.currentPiece = null;
        this.shadowPiece = null;
    }

    update() {
        this.spawnPiece();

        this.currentPiece.move(0, this.stepSize);
        if (this.isCollided(this.currentPiece)) {

            this.onCollided();

        }
    }

    onGameOver() {
        this.grid.cells.forEach(cell => {
            if (cell.value > 0) {
                cell.color = 'black';
                cell.boarderColor = 'white';
            }
        })

        this.currentPiece.color = 'black';
        this.currentPiece.boarderColor = 'red';
    }

    onKeyDown(ev) {

        switch (ev.code) {
            case 'ArrowLeft':
                this.currentPiece.move(-this.stepSize, 0);
                this.updateShadowPiece();
                break;
            case 'ArrowRight':
                this.currentPiece.move(this.stepSize, 0);
                this.updateShadowPiece();
                break;
            case 'ArrowDown':
                this.currentPiece.move(0, this.stepSize);
                this.updateShadowPiece();
                break;
            case 'ArrowUp':
                this.currentPiece.rotate();
                this.updateShadowPiece();
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

    onSpawnPiece() {

        if (this.currentPiece == null) return

        //adjust current piece spawn position
        const sPos = this.spawnPosition(this.currentPiece);
        this.currentPiece.setPos(sPos.x, sPos.y);

        // spawn a shadow piece
        const p = this.currentPiece.clone();
        p.color.a = 0.3;
        p.boarderColor.a = 0.3;
        this.shadowPiece = p;
    }

    spawnPiece() {
        if (this.currentPiece != null) return

        const i = Utils.randomInt(0, Piece.pieceTypes.length - 1);
        const type = Piece.pieceTypes[i];
        this.currentPiece = Piece.create(0, 0, type);
        this.onSpawnPiece();
    }

    dropCurrentPiece() {
        if (this.currentPiece == null) return
        this.currentPiece.setPos(this.shadowPiece.x, this.shadowPiece.y);
    }

    drawShadowPiece(ctx, piece) {
        const p = this.shadowPiece;
        this.updateShadowPiece();



        p.draw(ctx, this.grid.cellSize);
    }

    updateShadowPiece(piece = null) {
        const p = this.shadowPiece

        if (piece == null) {
            if (this.currentPiece == null) return
            piece = this.currentPiece;
        }
        p.shape = piece.shape;
        p.x = piece.x;
        p.y = this.grid.h; // TODO fix this, update the max Y, max Y not always the grid height

        while (this.isCollided(p)) {
            p.move(0, -this.stepSize);
        }
    }

    draw() {
        this.grid.draw(this.ctx);
        this.drawShadowPiece(this.ctx, this.currentPiece);
        if (this.currentPiece != null)
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
            }, 100
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

    setPos(x, y) {
        this.x = x;
        this.y = y;
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

    static create(x = 0, y = 0, pieceType = 'I') {
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