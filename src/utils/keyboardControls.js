import { EVENT_MOVEMENTS, DIRECTIONS } from '/src/utils/consts.js';
import { checkCollision } from '/src/utils/helpers.js';
import { startCollisionSound, startMoveSound, startRotateSound, startSpeedDownSound } from '/src/utils/sounds.js';



let keysPressed = {};
let movementStates = { isMovingleft: false, isMovingright: false, isMovingdown: false, isMovingrotate: false };


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

/**
 * Mueve una pieza en la dirección especificada y realiza las acciones necesarias en caso de colisión.
 * @param {Array} board - El tablero de juego.
 * @param {Object} piece - La pieza a mover.
 * @param {string} direction - La dirección del movimiento ('left', 'right', 'down', 'rotate', 'space').
 * @param {Object} options - Opciones adicionales como solidificar la pieza y eliminar líneas.
 */
export function movePiece(board, piece, direction, { solidifyPiece, removeLines } = {}) {
    // Iniciar el sonido de movimiento
    startMoveSound();

    // Guardar las coordenadas originales de la pieza
    const originalX = piece.position.x;
    const originalY = piece.position.y;

    // Realizar el movimiento según la dirección especificada
    switch (direction) {
        case 'left':
            piece.position.x--;
            break;
        case 'right':
            piece.position.x++;
            break;
        case 'down':
            piece.position.y++;
            break;
        case 'rotate':
            // Iniciar el sonido de rotación
            startRotateSound();
            rotatePiece(board, piece);
            break;
        case 'space':
              // Iniciar el sonido de movimiento rápido hacia abajo
            startSpeedDownSound();
            // Realizar movimiento rápido hacia abajo
            speedDown(board, piece, { solidifyPiece, removeLines });
            break;
        default:
            // Manejar direcciones no válidas o faltantes
            throw new Error(`Dirección de movimiento no válida: ${direction}`);
    }

    // Comprobar si hay colisión
    if (checkCollision(board, piece)) {
        // Revertir el movimiento en caso de colisión
        piece.position.x = originalX;
        piece.position.y = originalY;

        // Solidificar la pieza y eliminar líneas si es necesario
        solidifyPiece && solidifyPiece();
        removeLines && removeLines();

        // Iniciar el sonido de colisión
        startCollisionSound();
    }
}

/**
 * Realiza un movimiento rápido hacia abajo de la pieza hasta que haya colisión.
 * @param {Array} board - El tablero de juego.
 * @param {Object} piece - La pieza a mover.
 * @param {Object} options - Opciones adicionales como solidificar la pieza y eliminar líneas.
 */
export const speedDown = (board, piece, { solidifyPiece, removeLines }) => {
  

    // Mover hacia abajo hasta que haya colisión
    for (let i = 0; i < board.length; i++) {
        piece.position.y++;
        if (checkCollision(board, piece)) {
            piece.position.y--;
            // Solidificar la pieza y eliminar líneas si es necesario
            solidifyPiece && solidifyPiece();
            removeLines && removeLines();
            // Iniciar el sonido de colisión
            startCollisionSound();
            break;
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
const MOVE_INTERVAL = 120; // Controla la velocidad de movimiento, en milisegundos

function continueMovement(board, piece, direction, controlFunctions ) {
    const now = performance.now();

    if (movementStates[`isMoving${direction}`] && now - lastMoveTime > MOVE_INTERVAL) {
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


