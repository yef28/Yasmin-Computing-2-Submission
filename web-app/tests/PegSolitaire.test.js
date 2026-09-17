import assert from "node:assert";
import {
    createBoard,
    getCell,
    isValidMove,
    applyMove,
    validMoves,
    pegCount,
    isWon,
    isGameOver,
    isOnBoard,
    getAllPositions,
    boardToString
} from "../PegSolitaire.js";

describe("createBoard", function () {
    it("creates a board with 33 playable holes", function () {
        const board = createBoard();
        const playable = board.filter((cell) => cell !== null);
        assert.equal(playable.length, 33);
    });
    it("fills every playable hole with a peg except the centre", function () {
        const board = createBoard();
        assert.equal(pegCount(board), 32);
    });
    it("leaves the centre hole empty", function () {
        const board = createBoard();
        assert.equal(getCell(board, {row: 3, col: 3}), false);
    });
});

describe("isOnBoard", function () {
    it("is true for a position in the centre band of the cross", function () {
        assert.equal(isOnBoard({row: 3, col: 0}), true);
    });
    it("is true for a position in the centre column of the cross", function () {
        assert.equal(isOnBoard({row: 0, col: 3}), true);
    });
    it(
        "is false for a position in one of the four removed corners",
        function () {
            assert.equal(isOnBoard({row: 0, col: 0}), false);
        }
    );
    it("is false for a position entirely outside the 7x7 grid", function () {
        assert.equal(isOnBoard({row: 7, col: 3}), false);
    });
});

describe("getCell", function () {
    it("returns null for a position off the board", function () {
        const board = createBoard();
        assert.equal(getCell(board, {row: 0, col: 0}), null);
    });
    it("returns true for a peg-occupied hole on a fresh board", function () {
        const board = createBoard();
        assert.equal(getCell(board, {row: 0, col: 2}), true);
    });
});

describe("isValidMove", function () {
    it("is true for a legal opening jump towards the centre", function () {
        const board = createBoard();
        const result = isValidMove(
            board,
            {row: 1, col: 3},
            {row: 3, col: 3}
        );
        assert.equal(result, true);
    });
    it("is false when there is no peg at the 'from' position", function () {
        const board = createBoard();
        const result = isValidMove(
            board,
            {row: 3, col: 3}, // the empty centre hole
            {row: 3, col: 1}
        );
        assert.equal(result, false);
    });
    it("is false when the destination hole is already occupied", function () {
        const board = createBoard();
        const result = isValidMove(
            board,
            {row: 2, col: 0},
            {row: 2, col: 2} // occupied by a peg on a fresh board
        );
        assert.equal(result, false);
    });
    it("is false when there is no peg in the middle to jump over", function () {
        let board = createBoard();
        // Empty out the peg that would sit between (1,3) and (3,3).
        board = applyMove(board, {row: 1, col: 3}, {row: 3, col: 3});
        // Refill the centre so only the jumped peg (2,3) is missing.
        const result = isValidMove(
            board,
            {row: 0, col: 3},
            {row: 2, col: 3}
        );
        assert.equal(result, false);
    });
    it("is false when the move is not a straight two-cell jump", function () {
        const board = createBoard();
        const result = isValidMove(
            board,
            {row: 2, col: 2},
            {row: 3, col: 3} // diagonal, not a straight jump
        );
        assert.equal(result, false);
    });
});

describe("applyMove", function () {
    it("moves the peg from its origin to its destination", function () {
        const board = createBoard();
        const next = applyMove(
            board,
            {row: 1, col: 3},
            {row: 3, col: 3}
        );
        assert.equal(getCell(next, {row: 1, col: 3}), false);
        assert.equal(getCell(next, {row: 3, col: 3}), true);
    });
    it("removes the peg that was jumped over", function () {
        const board = createBoard();
        const next = applyMove(
            board,
            {row: 1, col: 3},
            {row: 3, col: 3}
        );
        assert.equal(getCell(next, {row: 2, col: 3}), false);
    });
    it("reduces the peg count by exactly one", function () {
        const board = createBoard();
        const next = applyMove(
            board,
            {row: 1, col: 3},
            {row: 3, col: 3}
        );
        assert.equal(pegCount(next), pegCount(board) - 1);
    });
    it("does not mutate the board passed in", function () {
        const board = createBoard();
        applyMove(board, {row: 1, col: 3}, {row: 3, col: 3});
        assert.equal(getCell(board, {row: 1, col: 3}), true);
        assert.equal(getCell(board, {row: 3, col: 3}), false);
    });
    it("returns the board unchanged if the move is not legal", function () {
        const board = createBoard();
        const next = applyMove(
            board,
            {row: 3, col: 3}, // no peg here to move
            {row: 3, col: 1}
        );
        assert.deepEqual(next, board);
    });
});

describe("validMoves", function () {
    it("lists exactly four legal moves on a fresh board", function () {
        const board = createBoard();
        assert.equal(validMoves(board).length, 4);
    });
    it(
        "only includes moves that isValidMove also considers legal",
        function () {
            const board = createBoard();
            const moves = validMoves(board);
            moves.forEach(function (move) {
                assert.equal(isValidMove(board, move.from, move.to), true);
            });
        }
    );
    it(
        "is empty once the game reaches a stuck (non-won) position",
        function () {
            // A genuine sequence of legal moves, found by random playout
            // and verified against this module, that leaves 8 pegs on
            // the board with no further legal jumps available.
            const stuckMoves = [
                [[3, 5], [3, 3]], [[1, 4], [3, 4]], [[1, 2], [1, 4]],
                [[2, 2], [2, 4]], [[2, 5], [2, 3]], [[4, 4], [2, 4]],
                [[1, 4], [3, 4]], [[6, 4], [4, 4]], [[3, 3], [1, 3]],
                [[3, 1], [3, 3]], [[3, 3], [3, 5]], [[5, 3], [3, 3]],
                [[4, 1], [4, 3]], [[4, 3], [2, 3]], [[6, 2], [6, 4]],
                [[3, 6], [3, 4]], [[1, 3], [3, 3]], [[3, 4], [5, 4]],
                [[6, 4], [4, 4]], [[2, 0], [2, 2]], [[4, 0], [2, 0]],
                [[4, 5], [4, 3]], [[3, 3], [5, 3]], [[5, 2], [5, 4]]
            ];
            let board = createBoard();
            stuckMoves.forEach(function ([from, to]) {
                const fromPosition = {row: from[0], col: from[1]};
                const toPosition = {row: to[0], col: to[1]};
                assert.equal(
                    isValidMove(board, fromPosition, toPosition),
                    true
                );
                board = applyMove(board, fromPosition, toPosition);
            });
            assert.equal(validMoves(board).length, 0);
            assert.equal(pegCount(board), 8);
            assert.equal(isGameOver(board), true);
            assert.equal(isWon(board), false);
        }
    );
});

describe("pegCount", function () {
    it("counts 32 pegs on a fresh board", function () {
        const board = createBoard();
        assert.equal(pegCount(board), 32);
    });
});

describe("isWon and isGameOver", function () {
    it("is not won and not over on a fresh board", function () {
        const board = createBoard();
        assert.equal(isWon(board), false);
        assert.equal(isGameOver(board), false);
    });

    it(
        "is won, with exactly one peg left, after a verified full solution",
        function () {
            // This is a genuine, verified solution to the standard
            // 33-hole board (found by exhaustive search), not a
            // hand-picked shortcut. It exercises applyMove and isWon
            // together over a realistic full game, not just one move.
            const solution = [
                [[1, 3], [3, 3]], [[2, 1], [2, 3]], [[0, 2], [2, 2]],
                [[0, 4], [0, 2]], [[2, 3], [2, 1]], [[2, 0], [2, 2]],
                [[2, 4], [0, 4]], [[2, 6], [2, 4]], [[3, 2], [1, 2]],
                [[0, 2], [2, 2]], [[3, 0], [3, 2]], [[3, 2], [1, 2]],
                [[3, 4], [1, 4]], [[0, 4], [2, 4]], [[3, 6], [3, 4]],
                [[3, 4], [1, 4]], [[5, 2], [3, 2]], [[4, 0], [4, 2]],
                [[4, 2], [2, 2]], [[1, 2], [3, 2]], [[3, 2], [3, 4]],
                [[4, 4], [2, 4]], [[1, 4], [3, 4]], [[4, 6], [4, 4]],
                [[4, 3], [4, 5]], [[6, 4], [4, 4]], [[3, 4], [5, 4]],
                [[6, 2], [6, 4]], [[6, 4], [4, 4]], [[4, 5], [4, 3]],
                [[4, 3], [6, 3]]
            ];
            let board = createBoard();
            solution.forEach(function ([from, to]) {
                const fromPosition = {row: from[0], col: from[1]};
                const toPosition = {row: to[0], col: to[1]};
                assert.equal(
                    isValidMove(board, fromPosition, toPosition),
                    true
                );
                board = applyMove(board, fromPosition, toPosition);
            });
            assert.equal(pegCount(board), 1);
            assert.equal(isWon(board), true);
            assert.equal(isGameOver(board), true);
        }
    );
});

describe("getAllPositions", function () {
    it(
        "returns exactly the 33 positions that are part of the board",
        function () {
            const positions = getAllPositions();
            assert.equal(positions.length, 33);
        }
    );
    it("only returns positions for which isOnBoard is true", function () {
        const positions = getAllPositions();
        positions.forEach(function (position) {
            assert.equal(isOnBoard(position), true);
        });
    });
});

describe("boardToString", function () {
    it("renders a fresh board as a readable cross-shaped grid", function () {
        const board = createBoard();
        const expected = (
            "    # # #     \n" +
            "    # # #     \n" +
            "# # # # # # # \n" +
            "# # # . # # # \n" +
            "# # # # # # # \n" +
            "    # # #     \n" +
            "    # # #     "
        );
        assert.equal(boardToString(board), expected);
    });
    it("reflects a move having been applied", function () {
        let board = createBoard();
        board = applyMove(board, {row: 1, col: 3}, {row: 3, col: 3});
        const rendered = boardToString(board);
        const rows = rendered.split("\n");
        // Row 1 (the peg that moved) should now show an empty hole at col 3.
        assert.equal(rows[1][6], ".");
        // Row 3 (the destination) should now show a peg at col 3.
        assert.equal(rows[3][6], "#");
    });
});
