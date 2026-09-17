import {
    createBoard,
    getCell,
    isValidMove,
    applyMove,
    pegCount,
    isWon,
    isGameOver,
    isOnBoard,
    getBoardSize
} from "./PegSolitaire.js";

// The board is the single source of truth for the whole game. The UI
// never decides whether a move is legal or what the win condition is
// itself — it only reads state from, and calls functions on,
// PegSolitaire.js.
let board = createBoard();
let selected = null;

// Declared ahead of time because render() and handleCellClick() call
// each other: a click can trigger a re-render, and rendering a cell
// wires up a click handler. One of the two has to be referenced
// before its own declaration, so it is pre-declared here instead.
let render;

const boardElement = document.getElementById("board");
const statusElement = document.getElementById("status");
const restartButton = document.getElementById("restart");
const overlayElement = document.getElementById("overlay");
const overlayMessageElement = document.getElementById("overlay-message");

/**
 * Shows the full-screen overlay with a given message, styled as
 * either a win or a stuck-game outcome.
 * @param {string} message
 * @param {("won"|"stuck")} outcome
 */
function showOverlay(message, outcome) {
    overlayMessageElement.textContent = message;
    overlayElement.classList.remove("won", "stuck", "hidden");
    overlayElement.classList.add(outcome);
}

/**
 * Hides the full-screen overlay, e.g. after a restart.
 */
function hideOverlay() {
    overlayElement.classList.remove("won", "stuck");
    overlayElement.classList.add("hidden");
}

/**
 * Briefly informs the player that their move attempt wasn't legal.
 */
function showInvalidMoveMessage() {
    statusElement.textContent = "That's not a legal move — try again.";
}

/**
 * Updates the status area (always just the ongoing peg count) and
 * the full-screen overlay (which is the only place a win or a
 * stuck-game outcome gets announced).
 */
function updateStatus() {
    statusElement.textContent = pegCount(board) + " pegs remaining.";
    if (isWon(board)) {
        showOverlay("You solved it! One peg remains.", "won");
        return;
    }
    if (isGameOver(board)) {
        showOverlay(
            "No more moves left. " + pegCount(board) + " pegs remain.",
            "stuck"
        );
        return;
    }
    hideOverlay();
}

/**
 * Builds an invisible placeholder for a grid position that is not
 * part of the cross-shaped board, so the visible cells still line up
 * correctly in a 7x7 CSS grid.
 * @returns {HTMLDivElement}
 */
function renderOffBoardGap() {
    const gap = document.createElement("div");
    gap.classList.add("cell", "off-board");
    gap.setAttribute("aria-hidden", "true");
    return gap;
}

/**
 * Handles a click on a board cell, implementing select-then-move
 * interaction: first click selects a peg, second click attempts a
 * move to that destination.
 * @param {{row: number, col: number}} position
 */
function handleCellClick(position) {
    const hasPeg = getCell(board, position);

    if (selected === null) {
        if (hasPeg) {
            selected = position;
            render();
        }
        return;
    }

    const clickedSelectedAgain = (
        selected.row === position.row && selected.col === position.col
    );
    if (clickedSelectedAgain) {
        selected = null;
        render();
        return;
    }

    if (isValidMove(board, selected, position)) {
        board = applyMove(board, selected, position);
        selected = null;
        render();
        updateStatus();
        return;
    }

    // Not a legal move from the current selection. If the player
    // clicked a different peg, treat that as changing their
    // selection rather than an error.
    if (hasPeg) {
        selected = position;
    } else {
        selected = null;
        showInvalidMoveMessage();
    }
    render();
}

/**
 * Builds a single clickable cell for a position that is part of the
 * board (a peg or an empty hole).
 * @param {{row: number, col: number}} position
 * @returns {HTMLButtonElement}
 */
function renderCell(position) {
    const hasPeg = getCell(board, position);
    const button = document.createElement("button");
    const cellClass = (
        hasPeg
        ? "peg"
        : "hole"
    );
    const cellStateLabel = (
        hasPeg
        ? "peg"
        : "empty hole"
    );
    button.classList.add("cell", cellClass);
    const isSelected = (
        selected
        && selected.row === position.row
        && selected.col === position.col
    );
    if (isSelected) {
        button.classList.add("selected");
    }
    button.setAttribute(
        "aria-label",
        "Row " + (position.row + 1) + ", column " + (position.col + 1)
        + ": " + cellStateLabel
    );
    button.addEventListener("click", function () {
        handleCellClick(position);
    });
    return button;
}

/**
 * Rebuilds the on-screen board from scratch based on the current
 * `board` and `selected` state. Called after every change, rather
 * than trying to patch individual cells by hand.
 */
render = function () {
    boardElement.innerHTML = "";
    const size = getBoardSize();
    let row = 0;
    while (row < size) {
        let col = 0;
        while (col < size) {
            const position = {row, col};
            if (isOnBoard(position)) {
                boardElement.appendChild(renderCell(position));
            } else {
                boardElement.appendChild(renderOffBoardGap());
            }
            col += 1;
        }
        row += 1;
    }
};

restartButton.addEventListener("click", function () {
    board = createBoard();
    selected = null;
    render();
    updateStatus();
});

render();
updateStatus();
