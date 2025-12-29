import { EVENT_MOVEMENTS, DIRECTIONS } from '/src/utils/consts.js';
import { checkCollision } from '/src/utils/helpers.js';
import { 
    startCollisionSound, 
    startMoveSound, 
    startRotateSound, 
    startSpeedDownSound 
} from '/src/utils/sounds.js';

// ============================================================================
// CONFIGURACIÓN DE MOVIMIENTO
// ============================================================================

/**
 * Intervalos de tiempo para movimiento continuo (en frames @ 60fps)
 * 
 * Comportamiento deseado:
 * - Primer movimiento: INMEDIATO al tocar
 * - Pausa inicial: ~250ms (15 frames) antes de repetir
 * - Repeticiones: cada ~50ms (3 frames) - muy rápido
 * - Acciones especiales (rotar/drop): ~670ms (40 frames) entre repeticiones
 */
const TIMING = {
    INITIAL_DELAY: 15,        // Delay antes de empezar repetición rápida
    FAST_REPEAT: 3,           // Velocidad de repetición rápida
    RESET_TO: 13,             // Valor al que resetear para repetición rápida (15-13=2 frames)
    SPECIAL_INTERVAL: 40,     // Intervalo para rotate/space
};

// ============================================================================
// ESTADO INTERNO
// ============================================================================

const keysPressed = {};

const movementState = {
    counters: {
        standard: 0,    // Para left, right, down
        special: 0,     // Para rotate, space
    },
    firstPress: {
        left: true,
        right: true,
        down: true,
        rotate: true,
        space: true,
    },
    isActive: false,
};

// ============================================================================
// MANEJO DE TECLADO
// ============================================================================

export function handleKeyDown(event, board, piece, controlFunctions) {
    if (Object.values(EVENT_MOVEMENTS).includes(event.key)) {
        event.preventDefault();
    }

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

// ============================================================================
// MOVIMIENTO DE PIEZAS
// ============================================================================

export function movePiece(board, piece, direction, options = {}) {
    const { solidifyPiece, removeLines } = options;
    
    const originalX = piece.position.x;
    const originalY = piece.position.y;

    const moveSuccess = applyMovement(board, piece, direction, options);

    if (!moveSuccess) {
        piece.position.x = originalX;
        piece.position.y = originalY;

        if (direction === DIRECTIONS.DOWN) {
            solidifyPiece?.();
            removeLines?.();
            startCollisionSound();
        }
    }
}

function applyMovement(board, piece, direction, options) {
    switch (direction) {
        case DIRECTIONS.LEFT:
            piece.position.x--;
            startMoveSound();
            break;
            
        case DIRECTIONS.RIGHT:
            piece.position.x++;
            startMoveSound();
            break;
            
        case DIRECTIONS.DOWN:
            piece.position.y++;
            startMoveSound();
            break;
            
        case DIRECTIONS.ROTATE:
            startRotateSound();
            rotatePiece(board, piece);
            return true;
            
        case DIRECTIONS.SPACE:
            startSpeedDownSound();
            speedDown(board, piece, options);
            return true;
            
        default:
            console.warn(`Dirección de movimiento no válida: ${direction}`);
            return false;
    }

    return !checkCollision(board, piece);
}

export function speedDown(board, piece, options = {}) {
    const { solidifyPiece, removeLines } = options;

    while (!checkCollision(board, { ...piece, position: { ...piece.position, y: piece.position.y + 1 } })) {
        piece.position.y++;
    }

    solidifyPiece?.();
    removeLines?.();
    startCollisionSound();
}

export function rotatePiece(board, piece) {
    const originalMatrix = piece.matrix;
    const N = originalMatrix.length - 1;
    
    const rotatedMatrix = originalMatrix.map((row, i) =>
        row.map((_, j) => originalMatrix[N - j][i])
    );

    piece.matrix = rotatedMatrix;

    if (checkCollision(board, piece)) {
        piece.matrix = originalMatrix;
    }
}

// ============================================================================
// MOVIMIENTO CONTINUO (TÁCTIL/MANTENIDO)
// ============================================================================

/**
 * Maneja el movimiento continuo para controles táctiles
 * 
 * Patrón de comportamiento:
 * 1. Toque inicial → Movimiento INMEDIATO
 * 2. Espera ~250ms (delay inicial)
 * 3. Movimientos rápidos cada ~50ms mientras se mantiene presionado
 */
export function continueMovement(board, piece, movementStates, isTouching, controlFunctions) {
    if (!isTouching) {
        resetMovementState();
        return;
    }

    movementState.isActive = true;
    movementState.counters.standard++;
    movementState.counters.special++;

    processStandardMovement(board, piece, movementStates, controlFunctions);
    processSpecialMovement(board, piece, movementStates, controlFunctions);
}

/**
 * Procesa movimientos estándar (left, right, down)
 * - Primer movimiento: inmediato
 * - Delay: 15 frames (~250ms)
 * - Repetición rápida: cada 3 frames (~50ms)
 */
function processStandardMovement(board, piece, movementStates, controlFunctions) {
    const counter = movementState.counters.standard;

    // DOWN
    if (movementStates.isMovingdown) {
        if (movementState.firstPress.down || counter > TIMING.INITIAL_DELAY) {
            movementState.firstPress.down = false;
            movePiece(board, piece, DIRECTIONS.DOWN, controlFunctions);
            controlFunctions.updateDropCounter();
            
            // Resetear a 13 para que en 2 frames más (cuando counter=15) se vuelva a mover
            if (counter > TIMING.INITIAL_DELAY) {
                movementState.counters.standard = TIMING.RESET_TO;
            }
        }
    }

    // LEFT
    if (movementStates.isMovingleft) {
        if (movementState.firstPress.left || counter > TIMING.INITIAL_DELAY) {
            movementState.firstPress.left = false;
            movePiece(board, piece, DIRECTIONS.LEFT);
            
            if (counter > TIMING.INITIAL_DELAY) {
                movementState.counters.standard = TIMING.RESET_TO;
            }
        }
    }

    // RIGHT
    if (movementStates.isMovingright) {
        if (movementState.firstPress.right || counter > TIMING.INITIAL_DELAY) {
            movementState.firstPress.right = false;
            movePiece(board, piece, DIRECTIONS.RIGHT);
            
            if (counter > TIMING.INITIAL_DELAY) {
                movementState.counters.standard = TIMING.RESET_TO;
            }
        }
    }
}

/**
 * Procesa movimientos especiales (rotate, space)
 * - Intervalo más largo: 40 frames (~670ms)
 * - Permite resetear firstPress cuando se suelta
 */
function processSpecialMovement(board, piece, movementStates, controlFunctions) {
    const counter = movementState.counters.special;

    // ROTATE
    if (movementStates.isMovingrotate) {
        if (movementState.firstPress.rotate || counter > TIMING.SPECIAL_INTERVAL) {
            movementState.firstPress.rotate = false;
            rotatePiece(board, piece);
            
            if (counter > TIMING.SPECIAL_INTERVAL) {
                movementState.counters.special = 0;
            }
        }
    } else {
        // Permitir rotar de nuevo cuando se suelta
        movementState.firstPress.rotate = true;
    }

    // SPACE (Hard drop)
    if (movementStates.isMovingspace) {
        if (movementState.firstPress.space || counter > TIMING.SPECIAL_INTERVAL) {
            movementState.firstPress.space = false;
            speedDown(board, piece, controlFunctions);
            
            if (counter > TIMING.SPECIAL_INTERVAL) {
                movementState.counters.special = 0;
            }
        }
    } else {
        // Permitir drop de nuevo cuando se suelta
        movementState.firstPress.space = true;
    }
}

function resetMovementState() {
    movementState.counters.standard = 0;
    movementState.counters.special = 0;
    movementState.isActive = false;
    
    Object.keys(movementState.firstPress).forEach(key => {
        movementState.firstPress[key] = true;
    });
}