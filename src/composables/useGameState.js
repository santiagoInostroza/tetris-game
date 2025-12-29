import { ref, reactive } from 'vue';
import { BOARD_WIDTH, BOARD_HEIGHT } from '/src/utils/consts.js';
import { difficulty } from '/src/utils/config.js';
import { PIECES, COLORS } from '/src/utils/pieces.js';
import { createBoard, getNewPiece } from '/src/utils/helpers.js';

/**
 * Composable para manejar el estado del juego
 */
export function useGameState() {
    // Estado del juego
    const score = ref(0);
    const time = ref('00:00:00');
    const isPaused = ref(true);
    const isGameOver = ref(false);
    
    // Tablero y piezas
    const board = createBoard(BOARD_WIDTH, BOARD_HEIGHT);
    const pieces = ref(PIECES[difficulty.value]);
    
    const piece = reactive({
        position: { x: 5, y: 5 },
        matrix: {},
        color: null
    });

    const nextPiece = reactive({
        matrix: [], // ✅ CAMBIO: Array vacío en lugar de objeto vacío
        color: null
    });

    // Tiempo de juego
    let activeGameTime = 0;
    let lastUpdateTime = 0;
    let dropCounter = 0;

    /**
     * Inicializa una nueva pieza y genera la siguiente
     */
    function initializePiece() {
        // Si hay una próxima pieza, usarla
        if (nextPiece.matrix && nextPiece.matrix.length > 0) {
            piece.matrix = nextPiece.matrix;
            piece.color = nextPiece.color;
        } else {
            // Primera vez - generar pieza actual
            [piece.matrix, piece.color] = getNewPiece(pieces.value, COLORS);
        }
        
        // Generar la próxima pieza
        [nextPiece.matrix, nextPiece.color] = getNewPiece(pieces.value, COLORS);
        
        // Posicionar pieza actual
        piece.position.x = Math.floor((BOARD_WIDTH - piece.matrix[0].length) / 2);
        piece.position.y = 0;
    }

    /**
     * Resetea el estado del juego
     */
    function resetGameState() {
        score.value = 0;
        activeGameTime = 0;
        lastUpdateTime = 0;
        dropCounter = 0;
        time.value = '00:00:00';
        
        // Limpiar tablero
        board.splice(0, board.length, ...createBoard(BOARD_WIDTH, BOARD_HEIGHT));
        
        // ✅ CAMBIO: Resetear próxima pieza correctamente
        nextPiece.matrix = [];
        nextPiece.color = null;
        
        // Nueva pieza
        initializePiece();
        
        isPaused.value = false;
        isGameOver.value = false;
    }

    /**
     * Actualiza el contador de drop
     */
    function updateDropCounter() {
        dropCounter = 0;
    }

    /**
     * Obtiene el estado del tiempo
     */
    function getTimeState() {
        return {
            activeGameTime,
            lastUpdateTime,
            dropCounter
        };
    }

    /**
     * Actualiza el estado del tiempo
     */
    function setTimeState(newActiveTime, newLastUpdateTime, newDropCounter) {
        activeGameTime = newActiveTime;
        lastUpdateTime = newLastUpdateTime;
        dropCounter = newDropCounter;
    }

    return {
        // Estado reactivo
        score,
        time,
        isPaused,
        isGameOver,
        board,
        piece,
        nextPiece, // ⭐ NUEVO
        pieces,
        
        // Métodos
        initializePiece,
        resetGameState,
        updateDropCounter,
        getTimeState,
        setTimeState
    };
}