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
    static getCanvas(w, h, id) {
        const canvas = document.getElementById(id);
        if (canvas == null) {
            throw new Error('Canvas not found');
        }
        canvas.width = w;
        canvas.height = h;
        return canvas;
    }

    static drawTextBG(ctx, txt, font = "50px Arial", textColor = "red, ", bgColor = "white", x = 0, y = 0) {
        ctx.font = font;
        ctx.textBaseline = 'top';
        ctx.fillStyle = bgColor;
        var width = ctx.measureText(txt).width;
        ctx.fillRect(x, y, width, parseInt(font, 10));
        ctx.fillStyle = textColor;
        ctx.fillText(txt, x, y);
    }

    static sum(arr) {
        return arr.reduce((acc, val) => acc + val, 0)
    }

    static randomInt(min, max) {
        return Utils.asInt(Math.random() * (max - min + 1) + min);
    }

    static asInt(float) {
        return Math.trunc(float);
    }

    static sort(arr, desc = false) {
        return arr.sort((a, b) => desc ? b - a : a - b);
    }
}

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Game {

    static s_run() {
        const g = new Game()
        g.run()
    }

    static get WIDTH() {
        return 300;
    }

    static get HEIGHT() {
        return 600;
    }

    static get FPS() {
        return 80;
    }

    static get DROP_CYCLE() {
        return 1000;
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

    setDropSpeed(speed) {
        if (speed < 0 || speed > Game.DROP_CYCLE) return
        this.dropSpeed = speed;
    }

    reset() {
        const w = Game.WIDTH;
        const h = Game.HEIGHT;

        this.isGameOver = false;
        this.isPaused = false;
        this.isHeldPressed = false;

        this.grid = new Grid(0, 0, w, h, 30);
        this.currentPiece = null;
        this.shadowPiece = null;

        this.dropCycleCounter = 0;
        this.dropSpeed = Game.DROP_CYCLE * 5 / 100

        this.nextPiece = null;
        this.holdPiece = null;

        if (this.nextPieceUi == null) {
            this.nextPieceUi = new UI(200, 600, "appUI", this.grid.cellSize);
        }
        else {
            this.nextPieceUi.clear();
        }
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

        while (this.isCollided(this.currentPiece)) {
            this.currentPiece.move(0, -this.stepSize);
        }

        if (this.currentPiece.y < 0) {
            this.isGameOver = true;
            this.onGameOver();
            return
        }

        // set piece to grid
        for (let r = 0; r < this.currentPiece.shape.length; r++) {
            for (let c = 0; c < this.currentPiece.shape[r].length; c++) {
                const v = this.currentPiece.shape[r][c]
                if (v > 0) {
                    const x = this.currentPiece.x + c * this.stepSize;
                    const y = this.currentPiece.y + r * this.stepSize;
                    const cell = this.grid.getCelllAt(x, y);

                    if (cell == null) {
                        return
                    }

                    cell.color = this.currentPiece.color;
                    cell.value = v;

                    if (this.isFullRow(cell.y)) {
                        this.removeRow(cell.y);
                    }
                }
            }
        }

        this.currentPiece = null;
        this.shadowPiece = null;
        this.isHeldPressed = false;
    }

    isFullRow(y) {
        const row = this.grid.getRow(y)
        return row.every(cell => cell.value > 0);
    }


    update() {
        if (this.currentPiece == null) {
            if (this.nextPiece == null) {
                this.currentPiece = this.spawnPiece();
            } else {
                this.currentPiece = this.nextPiece;
            }
            this.onSpawnPiece();
        }

        this.dropCycleCounter += this.dropSpeed;
        if (this.dropCycleCounter >= Game.DROP_CYCLE) {
            this.currentPiece.move(0, this.stepSize);
            this.dropCycleCounter = 0;
        }

        if (this.isCollided(this.currentPiece)) {
            this.onCollided();
        }
    }

    removeRow(y) {
        while (true) {

            if (y < 0) return

            const row = this.grid.getRow(y);

            if (row.every(cell => cell.value <= 0))
                return

            const prevRow = this.grid.getRow(y - this.stepSize);

            if (prevRow.length != row.length) {
                console.assert('Invalid row length')
            }

            for (let i = 0; i < row.length; i++) {
                const dstCell = row[i]
                const srcCell = prevRow[i];
                dstCell.value = srcCell.value;
                dstCell.color = srcCell.color;
            }

            y -= this.stepSize;

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
        this.shadowPiece = null;
    }

    isInBounds(piece) {
        if (piece == null) return false

        for (let r = 0; r < piece.shape.length; r++) {
            for (let c = 0; c < piece.shape[r].length; c++) {
                const v = piece.shape[r][c]
                if (v > 0) {
                    const x = piece.x + c * this.stepSize;
                    const y = piece.y + r * this.stepSize;
                    const b = this.isInBoundsByXY(x, y);
                    if (!b) {
                        return b
                    }
                }
            }
        }
        return true
    }


    isInBoundsByXY(x, y) {
        const b = x >= 0 && x < this.grid.w && y < this.grid.h

        return b;
    }

    tryMove(piece, dx, dy) {
        if (piece == null) return false

        piece.move(dx, dy);
        const b = this.isInBounds(piece) && !this.isCollided(piece);
        if (!b) {
            piece.move(-dx, -dy);
        }
        return b;
    }

    onKeyDown(ev) {

        switch (ev.code) {

            case 'ArrowLeft': {
                if (this.currentPiece == null) return
                if (this.tryMove(this.currentPiece, -this.stepSize, 0)) {
                    this.updateShadowPiece();

                }
            } break;

            case 'ArrowRight': {
                if (this.currentPiece == null) return
                if (this.tryMove(this.currentPiece, this.stepSize, 0)) {
                    this.updateShadowPiece();

                }
            } break;

            case 'ArrowDown': {
                if (this.currentPiece == null) return
                if (this.tryMove(this.currentPiece, 0, this.stepSize)) {
                    this.updateShadowPiece();
                }
            } break;

            case 'ArrowUp': {
                if (this.currentPiece == null) return

                const oldShape = this.currentPiece.shape; // rotate return a newly allocated mem, so shallow copy is enough? a bit unsafe.

                this.currentPiece.rotate();

                if (this.isInBounds(this.currentPiece)) {
                    if (this.isCollided(this.currentPiece)
                        && this.isFailedAllDirections(this.currentPiece)) {
                        // undo
                        this.currentPiece.shape = oldShape;
                        break;
                    }

                    this.updateShadowPiece();
                }
                else {
                    // not in bounds
                    if (this.isFailedAllDirections(this.currentPiece)) {
                        // undo
                        this.currentPiece.shape = oldShape;
                        break;
                    } else {
                        if (this.isCollided(this.currentPiece)
                            && this.isFailedAllDirections(this.currentPiece)) {
                            // undo
                            this.currentPiece.shape = oldShape;
                            break;
                        }
                        this.updateShadowPiece();
                    }
                }

            } break;

            case 'Space':
                this.dropCurrentPiece();

                break;

            case 'Escape': {
                if (this.isGameOver) {
                    this.restart();
                } else {
                    this.pause()
                }
            } break;

            case 'ControlLeft':
            case 'ControlRight':

                {
                    if (this.isHeldPressed) return
                    
                    if (this.holdPiece != null && this.currentPiece != null) {
                        const pos = this.spawnPosition(this.holdPiece)
                        this.holdPiece.setPos(pos.x, pos.y);
                        
                        if (!this.isInBounds(this.holdPiece) && this.isFailedAllDirections(this.holdPiece)) {
                            // TODO: allow adjust hold piece position? adjust right or left until in bounds?
                            return;
                        }
                        
                        
                        // swap hold piece with current piece
                        const oldPiece = this.currentPiece;
                        this.currentPiece = this.holdPiece;
                        this.holdPiece = oldPiece;

                        // this.ui.clearAll();

                    } else {
                        this.holdPiece = this.currentPiece;
                        this.currentPiece = null;
                        
                    }
                    this.isHeldPressed = true;
                } break;

            case 'KeyR': {
                this.restart();
            } break;

            default:
                console.log(ev)
                break;
        }    }

    isFailedAllDirections(piece) {
        return !this.tryMove(piece, -this.stepSize, 0) // try left
            && !this.tryMove(piece, this.stepSize, 0) // try right
            && !this.tryMove(piece, 0, this.stepSize) // try down
            && !this.tryMove(piece, 0, -this.stepSize) // try up
    }

    restart() {
        this.reset();
        this.run();
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

        // spawn next piece
        this.nextPiece = this.spawnPiece();

        this.onSpawnNextPiece();
    }
    
    spawnPiece(type = null) {
        // if (this.currentPiece != null) return

        if (type == null) {
            const i = Utils.randomInt(0, Piece.pieceTypes.length - 1);
            type = Piece.pieceTypes[i];
        }

        return Piece.create(0, 0, this.grid.cellSize, type);
    }

    dropCurrentPiece() {
        if (this.currentPiece == null) return
        if (this.shadowPiece != null) {
            this.currentPiece.setPos(this.shadowPiece.x, this.shadowPiece.y);
        } else {
            this.drop(this.currentPiece);
        }
        this.onCollided();
    }

    drop(piece) {
        while (!this.isCollided(piece)) {
            piece.move(0, this.stepSize);
        }
        piece.move(0, -this.stepSize);

    }

    drawShadowPiece(ctx, piece = null) {
        const p = this.shadowPiece;
        if (p == null) return

        this.updateShadowPiece(piece);
        p.draw(ctx);
    }

    updateShadowPiece(piece = null) {
        if (piece == null) {
            if (this.currentPiece == null) return
            piece = this.currentPiece;
        }

        const p = this.shadowPiece
        if (p == null) return


        p.shape = piece.shape;
        p.color = piece.color.clone();
        p.color.a = 0.3;
        p.x = piece.x;
        p.y = piece.y;
        this.drop(p);
    }



    draw() {
        this.grid.draw(this.ctx);


        this.drawShadowPiece(this.ctx, this.currentPiece);
        if (this.currentPiece != null)
            this.currentPiece.draw(this.ctx);

        if (this.isGameOver) {
            Utils.drawTextBG(this.ctx, `Game Over`, "50px Arial", "black", "white", this.grid.w / 12, this.grid.h / 2);
        }

        if (this.nextPiece) {
            const w = this.nextPiece.cellSize * 4
            const h = this.nextPiece.cellSize * 4
            this.nextPieceUi.clear(0, 0, w, h);
            this.nextPiece.draw(this.nextPieceUi.ctx)
        }

        if (this.holdPiece) {
            const w = this.holdPiece.cellSize * 4
            const h = this.holdPiece.cellSize * 4

            const yOffset =  this.nextPieceUi.height() - h;
            
            
            this.nextPieceUi.clear(0, yOffset, w, h);
            this.holdPiece.draw(this.nextPieceUi.ctx, -this.holdPiece.x, -this.holdPiece.y + yOffset)
        }

    }

    pause() {
        if (this.isPaused) {
            this.isPaused = false;
            this.run();
        }
        else {
            this.isPaused = true;

            this.drawPause();
            console.assert(this.intervalId != null);
            clearInterval(this.intervalId);
        }
    }

    drawPause() {
        Utils.drawTextBG(this.ctx, `Pause`, "50px Arial", "black", "white", this.grid.w / 4, this.grid.h / 2);
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
            }, 1000 / Game.FPS
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

    getRow(y) {
        return this.cells.filter(cell => cell.y == y);
    }


    get nRow() {
        return Utils.asInt(this.h / this.cellSize);
    }

    get nCol() {
        return Utils.asInt(this.w / this.cellSize);
    }

    getCelllAt(x, y) {


        const row = Utils.asInt((y - this.y) / this.cellSize);
        const col = Utils.asInt((x - this.x) / this.cellSize);

        if (row < 0 || row >= this.nRow
            || col < 0 || col >= this.nCol) {
            return null;
        }

        const i = row * Utils.asInt(this.w / this.cellSize) + col

        return this.cells[i];
    }



    init(bg_color = 'gray') {
        const nCells = this.nCol * this.nRow;

        for (let i = 0; i < nCells; i++) {
            const row = i % this.nCol;
            const col = Utils.asInt(i / this.nCol)

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

    constructor(x, y, cellSize = 1) {
        this.x = x;
        this.y = y;
        this.cellSize = cellSize
        this.type = null;
        this.shape = null;
        this.color = 'cyan';
        this.boarderColor = new MyColor(0, 0, 0, 1);
        this.borderWidth = 2
    }

    clone() {
        const p = new Piece(this.x, this.y, this.cellSize);
        p.shape = this.shape.map(row => row.map(v => v));
        p.color = this.color.clone();
        p.type = this.type;
        return p;
    }

    nRow() {
        return this.shape.length;
    }

    nCol() {
        if (this.shape.length == 0) return 0;
        return this.shape[0].length;
    }

    draw(ctx, offsetX = 0, offsetY = 0) {
        this.shape.forEach((row, i) => {
            row.forEach((value, j) => {
                if (value === 1) {
                    const x = j * this.cellSize + this.x + offsetX;
                    const y = i * this.cellSize + this.y + offsetY;
                    Cell.s_draw(ctx,
                        x,
                        y,
                        this.cellSize,
                        this.color.toString(),
                        this.borderWidth,
                        this.boarderColor.toString());
                }
            })
        })
    }

    width(isIncludeEmpty = true) {
        if (isIncludeEmpty) {
            return this.nCol() * this.cellSize;
        } else {
            const ws = this.shape.map(row => row.filter(v => v > 0).length)
            const w = Math.max(...ws)
            return w * this.cellSize;
        }
    }

    height(isIncludeEmpty = true) {
        if (isIncludeEmpty) {
            return this.nRow() * this.cellSize;
        } else {
            const h = Utils.sum(this.shape.map(row => row.some(v => v > 0)))
            return h * this.cellSize;
        }
    }

    move(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    rotate() {
        const nRow = this.shape.length;
        const nCol = this.shape[0].length;

        console.assert(nRow > 0);
        console.assert(nRow == nCol);

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

    static create(x = 0, y = 0, cellSize, pieceType = 'I') {

        const p = new Piece(x, y, 'cyan');
        p.cellSize = cellSize;

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
                    [0, 0, 0],
                    [1, 1, 1],
                    [0, 1, 0],
                ];
                p.color = new MyColor(128, 0, 128, 1);
            } break;

            case 'S': {
                p.shape = [
                    [0, 0, 0],
                    [0, 1, 1],
                    [1, 1, 0],
                ];
                p.color = new MyColor(0, 255, 0, 1)
            } break;

            case 'Z': {
                p.shape = [
                    [0, 0, 0],
                    [1, 1, 0],
                    [0, 1, 1],
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


class UI {
    constructor(w = 200, h = 600, id = 'ui', cellSize = 30,) {
        this.canvas = Utils.getCanvas(w, h, id);
        this.ctx = this.canvas.getContext('2d');
        this.cellSize = cellSize;
    }

    height() {
        return this.canvas.height;
    }

    width() {
        return this.canvas.width;
    }

    _debugRect(x, y, w, h, color = 'black') {
        const oldStyle = this.ctx.fillStyle
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, w, h);
        this.ctx.fillStyle = oldStyle;
    }

    clear(x = null, y = null, w = null, h = null) {
        x = x || 0
        y = y || 0
        w = w || this.canvas.width
        h = h || this.canvas.height

        this.ctx.clearRect(x, y, w, h);
    }
}

// main

Game.s_run()
