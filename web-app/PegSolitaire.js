/**
 * PegSolitaire.js
 *
 * A pure-functional module representing the state and rules of a
 * standard 33-hole (European) Peg Solitaire board.
 *
 * The board is a flat array of 49 cells (7 x 7), where:
 *   - `true`  means a peg is present
 *   - `false` means an empty hole
 *   - `null`  means the cell is not part of the board (the corners)
 *
 * No function in this module mutates its input. Every function that
 * changes the board returns a brand new board array.
 */

/**
 * Functions for creating a fresh game.
 * @namespace PegSolitaire.Setup
 */

/**
 * Functions that check or apply a move, transitioning the board from
 * one state to another.
 * @namespace PegSolitaire.Moves
 */

/**
 * Functions that read or extract information from a board without
 * changing it.
 * @namespace PegSolitaire.Info
 */

/**
 * Functions concerned with presenting or inspecting the board (e.g.
 * for debugging), rather than gameplay logic itself.
 * @namespace PegSolitaire.Display
 */

const SIZE = 7;

/**
 * @typedef {Object} Position
 * @property {number} row - Zero-indexed row, 0 to 6.
 * @property {number} col - Zero-indexed column, 0 to 6.
 */

/**
 * A flat array of 49 cells representing the board.
 * @typedef {Array.<(boolean|null)>} Board
 */

/**
 * Converts a row/column position into an index into the flat board array.
 * @private
 * @param {Position} position
 * @returns {number}
 */
function toIndex({row, col}) {
    return row * SIZE + col;
}

/**
 * Determines whether a position falls within the cross-shaped
 * 33-hole board, as opposed to one of the four removed corners.
 * @memberof PegSolitaire.Info
 * @param {Position} position
 * @returns {boolean} True if the position is part of the board.
 */
function isOnBoard({row, col}) {
    if (row < 0 || row > 6 || col < 0 || col > 6) {
        return false;
    }
    const inMiddleRowBand = row >= 2 && row <= 4;
    const inMiddleColBand = col >= 2 && col <= 4;
    return inMiddleRowBand || inMiddleColBand;
}

/**
 * Creates the standard starting board: every valid hole filled with
 * a peg, except the centre hole, which starts empty.
 * @memberof PegSolitaire.Setup
 * @returns {Board} A new starting board.
 */
function createBoard() {
    const board = [];
    let row = 0;
    while (row < SIZE) {
        let col = 0;
        while (col < SIZE) {
            const position = {row, col};
            if (!isOnBoard(position)) {
                board.push(null);
            } else if (row === 3 && col === 3) {
                board.push(false); // centre hole starts empty
            } else {
                board.push(true);
            }
            col += 1;
        }
        row += 1;
    }
    return board;
}

/**
 * Reads the value of a single cell.
 * @memberof PegSolitaire.Info
 * @param {Board} board
 * @param {Position} position
 * @returns {boolean|null} true (peg), false (empty), or null (off-board).
 */
function getCell(board, position) {
    if (!isOnBoard(position)) {
        return null;
    }
    return board[toIndex(position)];
}

/**
 * Returns a new board with a single cell's value changed.
 * @private
 * @param {Board} board
 * @param {Position} position
 * @param {boolean} value
 * @returns {Board} A new board array; the original is left untouched.
 */
function setCell(board, position, value) {
    const next = board.slice();
    next[toIndex(position)] = value;
    return next;
}

/**
 * Returns the position directly between `from` and `to`, i.e. the
 * peg that would be jumped over by that move.
 * @private
 * @param {Position} from
 * @param {Position} to
 * @returns {Position}
 */
function midpoint(from, to) {
    return {
        row: (from.row + to.row) / 2,
        col: (from.col + to.col) / 2
    };
}

/**
 * Checks whether moving a peg from one position to another is a
 * legal Peg Solitaire jump: exactly two cells away in a straight
 * line, over an occupied cell, landing on an empty one.
 * @memberof PegSolitaire.Moves
 * @param {Board} board
 * @param {Position} from - Position of the peg being moved.
 * @param {Position} to - Destination hole.
 * @returns {boolean}
 */
function isValidMove(board, from, to) {
    if (!isOnBoard(from) || !isOnBoard(to)) {
        return false;
    }
    if (getCell(board, from) !== true || getCell(board, to) !== false) {
        return false;
    }
    const rowDistance = Math.abs(to.row - from.row);
    const colDistance = Math.abs(to.col - from.col);
    const isStraightJumpOfTwo = (
        (rowDistance === 2 && colDistance === 0) ||
        (rowDistance === 0 && colDistance === 2)
    );
    if (!isStraightJumpOfTwo) {
        return false;
    }
    return getCell(board, midpoint(from, to)) === true;
}

/**
 * Applies a jump move, removing the jumped peg. If the move is not
 * legal, the original board is returned unchanged, so callers should
 * check `isValidMove` first if they need to distinguish "no-op" from
 * "applied".
 * @memberof PegSolitaire.Moves
 * @param {Board} board
 * @param {Position} from
 * @param {Position} to
 * @returns {Board} A new board reflecting the move, or the original
 * board if the move was not legal.
 */
function applyMove(board, from, to) {
    if (!isValidMove(board, from, to)) {
        return board;
    }
    const jumped = midpoint(from, to);
    let next = setCell(board, from, false);
    next = setCell(next, jumped, false);
    next = setCell(next, to, true);
    return next;
}

const JUMP_DIRECTIONS = [
    {row: -2, col: 0},
    {row: 2, col: 0},
    {row: 0, col: -2},
    {row: 0, col: 2}
];

/**
 * Finds every legal move that starts from a single given position.
 * @private
 * @param {Board} board
 * @param {Position} from
 * @returns {Array.<{from: Position, to: Position}>}
 */
function movesFrom(board, from) {
    const moves = [];
    JUMP_DIRECTIONS.forEach(function (direction) {
        const to = {
            row: from.row + direction.row,
            col: from.col + direction.col
        };
        if (isValidMove(board, from, to)) {
            moves.push({from, to});
        }
    });
    return moves;
}

/**
 * Returns every position that is actually part of the board (i.e.
 * every position for which `isOnBoard` is true), in row-major order.
 * Intended for use by the UI when it needs to draw or iterate over
 * the board without knowing anything about its cross shape itself.
 * @memberof PegSolitaire.Info
 * @returns {Position[]}
 */
function getAllPositions() {
    const positions = [];
    let row = 0;
    while (row < SIZE) {
        let col = 0;
        while (col < SIZE) {
            const position = {row, col};
            if (isOnBoard(position)) {
                positions.push(position);
            }
            col += 1;
        }
        row += 1;
    }
    return positions;
}

/**
 * Returns every legal move available on the given board: every
 * peg's position is mapped to the (possibly empty) list of moves it
 * can make, and flatMap combines all of those lists into one.
 * @memberof PegSolitaire.Moves
 * @param {Board} board
 * @returns {Array.<{from: Position, to: Position}>}
 */
function validMoves(board) {
    return getAllPositions().filter(function (position) {
        return getCell(board, position) === true;
    }).flatMap(function (from) {
        return movesFrom(board, from);
    });
}

/**
 * Counts the pegs remaining on the board.
 * @memberof PegSolitaire.Info
 * @param {Board} board
 * @returns {number}
 */
function pegCount(board) {
    return board.filter(function (cell) {
        return cell === true;
    }).length;
}

/**
 * The game is won when exactly one peg remains.
 * @memberof PegSolitaire.Info
 * @param {Board} board
 * @returns {boolean}
 */
function isWon(board) {
    return pegCount(board) === 1;
}

/**
 * The game is over (won or lost) when no further legal moves exist.
 * @memberof PegSolitaire.Info
 * @param {Board} board
 * @returns {boolean}
 */
function isGameOver(board) {
    return validMoves(board).length === 0;
}

/**
 * Returns the side length of the square grid the board is laid out
 * on (7 for a standard board), so that other modules such as the
 * UI can lay out a grid without hard-coding the board's shape.
 * @memberof PegSolitaire.Info
 * @returns {number}
 */
function getBoardSize() {
    return SIZE;
}

/**
 * Chooses the display character for a single cell's value.
 * @private
 * @param {boolean|null} cell
 * @returns {string}
 */
function cellToCharacter(cell) {
    if (cell === true) {
        return "# ";
    }
    if (cell === false) {
        return ". ";
    }
    return "  ";
}

/**
 * Renders the board as a human-readable grid of characters, useful
 * for inspecting game state in a debug console.
 * `#` = peg, `.` = empty hole, ` ` = not part of the board.
 * @memberof PegSolitaire.Display
 * @param {Board} board
 * @returns {string}
 */
function boardToString(board) {
    const rows = [];
    let row = 0;
    while (row < SIZE) {
        let line = "";
        let col = 0;
        while (col < SIZE) {
            const cell = getCell(board, {row, col});
            line += cellToCharacter(cell);
            col += 1;
        }
        rows.push(line);
        row += 1;
    }
    return rows.join("\n");
}

export {
    createBoard,
    getCell,
    isValidMove,
    applyMove,
    validMoves,
    pegCount,
    isWon,
    isGameOver,
    isOnBoard,
    getBoardSize,
    getAllPositions,
    boardToString
};