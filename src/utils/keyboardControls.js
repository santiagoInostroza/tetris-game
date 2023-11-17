import { EVENT_MOVEMENTS, DIRECTIONS } from '/src/utils/consts.js';
import { checkCollision } from '/src/utils/helpers.js';
import { startCollisionSound, startMoveSound, startRotateSound } from '/src/utils/sounds.js';



let keysPressed = {};
let movementStates = { isMovingLeft: false, isMovingRight: false, isMovingDown: false, isRotating: false };


export function handleKeyDown(event, board, piece, controlFunctions) {
    keysPressed[event.key] = true;

    handleMovement(board, piece, controlFunctions);
}

export function handleKeyUp(event) {
    delete keysPressed[event.key];
}

function handleMovement(board, piece, controlFunctions) {
    if (keysPressed[EVENT_MOVEMENTS.LEFT]) {
        movePiece(board, piece, DIRECTIONS.LEFT);
    } 
    if (keysPressed[EVENT_MOVEMENTS.RIGHT]) {
        movePiece(board, piece, DIRECTIONS.RIGHT);
    }
    if (keysPressed[EVENT_MOVEMENTS.DOWN]) {
        movePiece(board, piece, DIRECTIONS.DOWN, controlFunctions);
        controlFunctions.updateDropCounter();
    }

    if (keysPressed[EVENT_MOVEMENTS.ROTATE]) {
        rotatePiece(board, piece);
    }

    if (keysPressed[EVENT_MOVEMENTS.SPACE]) {
        speedDown(board, piece, controlFunctions);
    } 
}

export function movePiece(board, piece, direction, { solidifyPiece, removeLines } = {}) {
    startMoveSound();
    switch (direction) {
        case 'left':
            piece.position.x--;
            if (checkCollision(board, piece)) {
                piece.position.x++; // Revertir el movimiento si hay colisión
            }
            break;
        case 'right':
            piece.position.x++;
            if (checkCollision(board, piece)) {
                piece.position.x--; // Revertir el movimiento si hay colisión
            }
            break;
        case 'down':
            piece.position.y++;
            if (checkCollision(board, piece)) {
                piece.position.y--; // Revertir el movimiento si hay colisión
                solidifyPiece();
                removeLines();
                startCollisionSound();
            }
            break;
        case 'rotate':
            startRotateSound();
            rotatePiece(board, piece);
            break;
        case 'space':
            speedDown(board, piece, { solidifyPiece, removeLines });
            break;
    }
}

export const speedDown = (board, piece, { solidifyPiece, removeLines }) => {
    let enter = true;
    while (enter) {
        piece.position.y++;
        if (checkCollision(board, piece)) {
            enter = false;
            piece.position.y--;
            solidifyPiece();
            removeLines();
            startCollisionSound()
        }
    }
};


export const rotatePiece = (board, piece) => {
    const matrix = piece.matrix;
    const N = matrix.length - 1;
    const result = matrix.map((row, i) =>
        row.map((val, j) => matrix[N - j][i])
    );
    piece.matrix = result;
    if (checkCollision(board, piece)) {
        piece.matrix = matrix;
    }
    
};

//   MOVIMIENTOS TACTILES
export function startMovement(board, piece, direction, controlFunctions = {}) {
    
   movementStates[`isMoving${direction}`] = true;
    continueMovement(board, piece, direction, controlFunctions);
}

export function stopMovement(direction) {
    movementStates[`isMoving${direction}`] = false;
}

let lastMoveTime = 0;
const moveInterval = 120; // Controla la velocidad de movimiento, en milisegundos

function continueMovement(board, piece, direction, controlFunctions ) {
    const now = performance.now();

    if (movementStates[`isMoving${direction}`] && now - lastMoveTime > moveInterval) {
        movePiece(board, piece, direction, controlFunctions);
        lastMoveTime = now; // Actualizar el tiempo de la última acción de movimiento
    }

    if (movementStates[`isMoving${direction}`]) {
        if (direction === DIRECTIONS.DOWN) {
            controlFunctions.updateDropCounter();
        }
        requestAnimationFrame(() => continueMovement(board, piece, direction, controlFunctions));
    }
}