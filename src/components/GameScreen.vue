<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { ISMOBILE, HEIGHT_CANVAS, BLOCK_SIZE, BOARD_WIDTH, BOARD_HEIGHT, DIRECTIONS } from '/src/utils/consts.js';
import { checkCollision } from '/src/utils/helpers.js';
import { DIFFICULTY } from '/src/utils/config.js';
import { name } from '/src/utils/player.js';
import { PIECES_IMAGES } from '/src/utils/images.js';

import { handleKeyDown, handleKeyUp, movePiece, continueMovement } from '/src/utils/keyboardControls.js';
import { drawSquare, showScoreOnCompletedLines, bonus as drawBonus, drawSquareWithBonus } from '/src/utils/draw.js';
import { createPlayer } from '/src/api/apiPlayer.js';

import SwitchButton from './components/SwitchButton.vue';

// Composables
import { useGameState } from '/src/composables/useGameState.js';
import { useGameAudio } from '/src/composables/useGameAudio.js';
import { useBonus } from '/src/composables/useBonus.js';
import { useGameLoop } from '/src/composables/useGameLoop.js';
import NextPiecePreview from './NextPiecePreview.vue';

// ============================================================================
// PROPS Y EMITS
// ============================================================================

const emit = defineEmits(['gameOver', 'menu']);


// ============================================================================
// COMPOSABLES
// ============================================================================

const gameState = useGameState();
const audio = useGameAudio();
const bonus = useBonus();
const gameLoop = useGameLoop(gameState, bonus, audio);

// ============================================================================
// REFS Y ESTADO LOCAL
// ============================================================================

const canvas = ref(null);
const context = ref(null);
const player = ref(null);
const hasName = ref(false);

// Estado de movimiento táctil
const movementStates = {
    isMovingleft: false,
    isMovingright: false,
    isMovingdown: false,
    isMovingrotate: false,
};
let isTouching = false;

// ============================================================================
// LIFECYCLE
// ============================================================================

onMounted(() => {
    initializeCanvas();
    initializePlayer();
    
    gameState.initializePiece();
    
    setupEventListeners();
    setupBrowserBehavior();
    
    gameLoop.startLoop(draw, handleAutoDrop);
});

onBeforeUnmount(() => {
    cleanup();
});

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

function initializeCanvas() {
    canvas.value.width = BLOCK_SIZE * BOARD_WIDTH;
    canvas.value.height = BLOCK_SIZE * BOARD_HEIGHT;
    context.value = canvas.value.getContext('2d');
    context.value.scale(BLOCK_SIZE, BLOCK_SIZE);
}

function initializePlayer() {
    if (name) {
        player.value = name;
        hasName.value = true;
    }
}

function setupEventListeners() {
    const keyDownHandler = (event) => handleKeyDown(
        event, 
        gameState.board, 
        gameState.piece, 
        { solidifyPiece, removeLines, updateDropCounter: gameState.updateDropCounter }
    );
    
    window.addEventListener('keydown', keyDownHandler);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', pause);
}

function setupBrowserBehavior() {
    window.onbeforeunload = () => '¿Estás seguro de que deseas abandonar esta página?';
    
    history.pushState(null, null, document.URL);
    window.addEventListener('popstate', () => {
        history.pushState(null, null, document.URL);
    });
}

function cleanup() {
    gameLoop.stopLoop();
    
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    window.removeEventListener('blur', pause);
    window.removeEventListener('popstate', () => {});
    window.onbeforeunload = null;
}

// ============================================================================
// GAME LOGIC
// ============================================================================

function solidifyPiece() {
    gameState.piece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value > 0) {
                const boardY = gameState.piece.position.y + y;
                const boardX = gameState.piece.position.x + x;
                const bonusValue = bonus.assignBonus(boardY);
                
                gameState.board[boardY][boardX] = {
                    value,
                    color: gameState.piece.color,
                    bonus: bonusValue
                };
            }
        });
    });
    
    gameState.initializePiece();
    
    if (checkCollision(gameState.board, gameState.piece)) {
        endGame();
    }
}

function removeLines() {
    const result = bonus.processCompletedLines(gameState.board);
    
    if (result.lineCount === 0) return;
    
    processLineRemoval(result.linePositions, result.totalBonus);
}

function processLineRemoval(linePositions, totalBonus) {
    let currentLine = 0;
    
    function removeNextLine() {
        if (currentLine >= linePositions.length) {
            if (totalBonus > 0) {
                bonus.startBonusAnimation(
                    40, 
                    'X' + totalBonus, 
                    totalBonus,
                    () => audio.stopBonusAndResumeGame()
                );
                audio.playBonusSound();
            }
            
            setTimeout(() => bonus.hideLineScore(), 1000);
            return;
        }
        
        const y = linePositions[currentLine];
        
        bonus.removeLine(gameState.board, y);
        
        const multiplier = bonus.getMultiplier();
        const lineScore = ((currentLine + 1) * BOARD_WIDTH) * (1 + (currentLine * 0.25)) * multiplier;
        
        bonus.showLineScore(y, lineScore);
        bonus.playLineSound(currentLine);
        
        if (currentLine === linePositions.length - 1) {
            gameState.score.value += lineScore;
        }
        
        currentLine++;
        setTimeout(removeNextLine, 400);
    }
    
    removeNextLine();
}

function endGame() {
    gameState.isGameOver.value = true;
    pause();
    audio.stopMusic();
    
    if (hasName.value && gameState.score.value > 0) {
        submitPlayerScore();
    }
}

async function submitPlayerScore() {
    if (!player.value) return;
    
    hasName.value = true;
    
    try {
        const newPlayer = {
            name: player.value,
            score: gameState.score.value,
            time: gameState.time.value,
            difficulty: DIFFICULTY.value,
        };
        
        await createPlayer(newPlayer);
    } catch (error) {
        console.error("Error al agregar el puntaje:", error);
    }
}

function restartGame() {
    gameState.resetGameState();
    bonus.resetBonus();
    gameLoop.startLoop(draw, handleAutoDrop); 
}

function handleAutoDrop() {
    movePiece(
        gameState.board, 
        gameState.piece, 
        DIRECTIONS.DOWN, 
        { solidifyPiece, removeLines }
    );
}

// ============================================================================
// CONTROLES
// ============================================================================

function pause() {
    gameLoop.pauseLoop();
}

function togglePause() {
    if (!gameState.isPaused.value) {
        pause();
    } else {
        gameLoop.resumeLoop(draw, handleAutoDrop);
    }
}

function menu() {
    emit('menu');
}

function startMovement(direction) {
    movementStates[`isMoving${direction}`] = true;
    isTouching = true;
}

function stopMovement(direction) {
    movementStates[`isMoving${direction}`] = false;
    isTouching = Object.values(movementStates).some(value => value);
}
// ============================================================================
// DETECCIÓN DE GESTOS (MEJORADO)
// ============================================================================

let touchStartX = 0;
let touchStartY = 0;
let currentDirection = null;
let isHoldingDown = false;

function handleTouchStart(event) {
    const touch = event.touches ? event.touches[0] : event;
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    
    detectDirection(touch.clientX, touch.clientY, rect, true);
}

function handleTouchMove(event) {
    const touch = event.touches ? event.touches[0] : event;
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    
    detectDirection(touch.clientX, touch.clientY, rect, false);
}

function handleTouchEnd() {
    // Detener todas las direcciones activas
    if (currentDirection) {
        if (Array.isArray(currentDirection)) {
            // Es movimiento diagonal
            currentDirection.forEach(dir => stopMovement(dir));
        } else {
            // Es movimiento simple
            stopMovement(currentDirection);
        }
        currentDirection = null;
    }
    isHoldingDown = false;
}

function detectDirection(x, y, rect, isStart) {
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = x - centerX;
    const deltaY = y - centerY;
    
    // Calcular distancia desde el centro
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const threshold = rect.width * 0.15; // 15% del ancho como zona muerta central
    
    if (distance < threshold) {
        // Zona muerta central - no hacer nada
        return;
    }
    
    let newDirection = null;
    
    // Determinar si es movimiento diagonal o simple
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const diagonalThreshold = 0.5; // Ratio para detectar diagonal
    
    // Si ambos ejes tienen valores significativos, es diagonal
    if (absX > threshold && absY > threshold) {
        const ratio = Math.min(absX, absY) / Math.max(absX, absY);
        
        if (ratio > diagonalThreshold) {
            // Movimiento diagonal
            const horizontal = deltaX > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
            const vertical = deltaY > 0 ? DIRECTIONS.DOWN : DIRECTIONS.ROTATE;
            newDirection = [horizontal, vertical];
        } else {
            // Un eje domina
            if (absX > absY) {
                newDirection = deltaX > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
            } else {
                newDirection = deltaY > 0 ? DIRECTIONS.DOWN : DIRECTIONS.ROTATE;
            }
        }
    } else {
        // Movimiento simple en un solo eje
        if (absX > absY) {
            newDirection = deltaX > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
        } else {
            newDirection = deltaY > 0 ? DIRECTIONS.DOWN : DIRECTIONS.ROTATE;
        }
    }
    
    // Verificar si cambió la dirección
    const dirChanged = !directionsEqual(newDirection, currentDirection);
    
    if (dirChanged) {
        // Detener dirección anterior
        if (currentDirection) {
            if (Array.isArray(currentDirection)) {
                currentDirection.forEach(dir => stopMovement(dir));
            } else {
                stopMovement(currentDirection);
            }
        }
        
        // Iniciar nueva dirección
        if (newDirection) {
            if (Array.isArray(newDirection)) {
                newDirection.forEach(dir => startMovement(dir));
            } else {
                startMovement(newDirection);
            }
        }
        
        currentDirection = newDirection;
    }
}

function directionsEqual(dir1, dir2) {
    if (dir1 === dir2) return true;
    if (!dir1 || !dir2) return false;
    
    // Comparar arrays
    if (Array.isArray(dir1) && Array.isArray(dir2)) {
        if (dir1.length !== dir2.length) return false;
        return dir1.every((d, i) => d === dir2[i]);
    }
    
    return false;
}

// ============================================================================
// MOVIMIENTOS DIAGONALES (MANTENER PARA LAS ZONAS)
// ============================================================================

let diagonalInterval = null;

function startDiagonal(direction) {
    if (direction === 'down-left') {
        startMovement(DIRECTIONS.LEFT);
        startMovement(DIRECTIONS.DOWN);
        
        diagonalInterval = setInterval(() => {
            movePiece(
                gameState.board, 
                gameState.piece, 
                DIRECTIONS.LEFT, 
                { solidifyPiece, removeLines }
            );
        }, 100);
    } else if (direction === 'down-right') {
        startMovement(DIRECTIONS.RIGHT);
        startMovement(DIRECTIONS.DOWN);
        
        diagonalInterval = setInterval(() => {
            movePiece(
                gameState.board, 
                gameState.piece, 
                DIRECTIONS.RIGHT, 
                { solidifyPiece, removeLines }
            );
        }, 100);
    }
}

function stopDiagonal(direction) {
    if (diagonalInterval) {
        clearInterval(diagonalInterval);
        diagonalInterval = null;
    }
    
    if (direction === 'down-left') {
        stopMovement(DIRECTIONS.LEFT);
        stopMovement(DIRECTIONS.DOWN);
    } else if (direction === 'down-right') {
        stopMovement(DIRECTIONS.RIGHT);
        stopMovement(DIRECTIONS.DOWN);
    }
}

// ============================================================================
// RENDERIZADO
// ============================================================================

function draw(deltaTime) {
    if (!context.value || !canvas.value) {
        console.warn('Canvas context no disponible');
        return;
    }
    
    context.value.fillStyle = 'black';
    context.value.fillRect(0, 0, canvas.value.width, canvas.value.height);
    
    gameState.board.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell.value > 0) {
                drawSquare(context.value, x, y, cell.color, 'gray', 0.05, 'black');
                
                if (cell.bonus > 0) {
                    drawSquareWithBonus(context.value, x, y, 'X' + cell.bonus);
                }
                
                if (cell.color === 'ghost') {
                    context.value.drawImage(PIECES_IMAGES.ghost, x, y, 1, 1);
                }
                
                if (cell.color === 'christmas') {
                    context.value.drawImage(PIECES_IMAGES.christmas, x, y, 1, 1);
                }
            }
        });
    });
    
    if (gameState.piece?.matrix) {
        gameState.piece.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    drawSquare(
                        context.value,
                        gameState.piece.position.x + x,
                        gameState.piece.position.y + y,
                        gameState.piece.color,
                        gameState.piece.color,
                        0.06,
                        'black',
                        bonus.showBonus.value,
                        PIECES_IMAGES
                    );
                }
            });
        });
    }
    
    if (bonus.showScoreOnLine.value) {
        showScoreOnCompletedLines(context.value, bonus.newScore.value, bonus.linePosition.value);
    }
    
    if (bonus.showBonus.value) {
        bonus.remainingBonusTime.value -= deltaTime;
        drawBonus(
            context.value,
            bonus.textBonus.value,
            bonus.remainingBonusTime.value,
            bonus.timeBonus.value
        );
    }
    
    continueMovement(
        gameState.board,
        gameState.piece,
        movementStates,
        isTouching,
        { solidifyPiece, removeLines, updateDropCounter: gameState.updateDropCounter }
    );
}
</script>

<template>
    <!-- CONTENEDOR PRINCIPAL -->
    <div class="game-container">

        <!-- ========== VERSIÓN MÓVIL ========== -->
        <div v-if="ISMOBILE" class="mobile-layout">
            <!-- Área de juego (arriba) -->
            <div class="game-area">
                <!-- Canvas (izquierda, 75%) -->
                <div class="mobile-canvas-area">
                    <canvas class="game-canvas" ref="canvas"></canvas>
                </div>

                <!-- Panel derecho (25%) -->
                <div class="mobile-sidebar">
                    <!-- Puntaje -->
                    <div class="stat-vertical">
                        <span class="stat-label-v">PUNTAJE</span>
                        <span class="stat-value-v">{{ gameState.score.value }}</span>
                    </div>

                    <!-- Tiempo -->
                    <div class="stat-vertical">
                        <span class="stat-label-v">TIEMPO</span>
                        <span class="stat-value-v-small">{{ gameState.time.value }}</span>
                    </div>

                    <!-- Próxima Pieza -->
                    <div class="next-preview-vertical">
                        <span class="next-label">SIGUIENTE</span>
                        <NextPiecePreview :nextPiece="gameState.nextPiece" />
                    </div>

                    <!-- Botón Opciones -->
                    <button 
                        @click="togglePause" 
                        class="btn-options-vertical"
                    >
                        OPCIONES
                    </button>
                </div>
            </div>

            <!-- Controles (abajo, fuera del flex) -->
            <div class="controls-area">
                <div class="mobile-controls" @contextmenu.prevent>
                    <!-- D-Pad -->
                    <div class="dpad-container">
                        <button  
                            @touchstart.prevent="handleTouchStart"
                            @touchmove.prevent="handleTouchMove"
                            @touchend.prevent="handleTouchEnd"
                            @mousedown.prevent="handleTouchStart"
                            @mousemove.prevent="handleTouchMove"
                            @mouseup="handleTouchEnd"
                            @mouseleave="handleTouchEnd"
                            @contextmenu.prevent
                            class="dpad-zone"
                            aria-label="Controles direccionales"
                        >
                            <div class="dpad-visual">
                                <!-- Flechas visibles -->
                                <div class="dpad-arrow dpad-left">◀</div>
                                <div class="dpad-arrow dpad-up">▲</div>
                                <div class="dpad-arrow dpad-down">▼</div>
                                <div class="dpad-arrow dpad-right">▶</div>
                                
                                <!-- ⭐ NUEVO: Zonas diagonales invisibles -->
                                <div class="dpad-diagonal dpad-down-left" 
                                    @touchstart.prevent="startDiagonal('down-left')"
                                    @touchend.prevent="stopDiagonal('down-left')">
                                </div>
                                <div class="dpad-diagonal dpad-down-right"
                                    @touchstart.prevent="startDiagonal('down-right')"
                                    @touchend.prevent="stopDiagonal('down-right')">
                                </div>
                                
                                <div class="dpad-center"></div>
                            </div>
                        </button>
                    </div>

                    <!-- Botón rotar -->
                    <button 
                        @touchstart.prevent="startMovement(DIRECTIONS.ROTATE)" 
                        @touchend.prevent="stopMovement(DIRECTIONS.ROTATE)"
                        @mousedown.prevent="startMovement(DIRECTIONS.ROTATE)"
                        @mouseup="stopMovement(DIRECTIONS.ROTATE)"
                        @mouseleave="stopMovement(DIRECTIONS.ROTATE)"
                        @contextmenu.prevent
                        class="btn-rotate-new" 
                        aria-label="Rotar pieza"
                    >
                        <span class="rotate-icon">↻</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- ========== VERSIÓN DESKTOP ========== -->
        <div v-else class="desktop-layout">
            <div class="desktop-left-panel">
                <div class="score-display">
                    <span class="score-label">Puntaje</span>
                    <span class="score-value">{{ gameState.score.value }}</span>
                </div>
                <NextPiecePreview :nextPiece="gameState.nextPiece" />
            </div>
            
            <div class="desktop-canvas" :style="{ height: HEIGHT_CANVAS + 'px' }">
                <canvas class="border-shine rounded-xl bg-blue-400" ref="canvas"></canvas>
            </div>
            
            <div class="desktop-right-panel">
                <div class="time-display">
                    <span class="time-label">Tiempo</span>
                    <span class="time-value">{{ gameState.time.value }}</span>
                </div>
                <button 
                    @click="togglePause" 
                    class="w-32 p-2 rounded-xl deep-button border-shine" 
                    style="font-size: 12px;"
                >
                    OPCIONES
                </button>
            </div>
        </div>
    </div>

    <!-- MODALES -->
    <div>
        <!-- MODAL PAUSA-->
        <article v-if="gameState.isPaused.value && !gameState.isGameOver.value">
            <div class="modal-overlay"></div>
            <div class="modal-container">
                <h2 class="modal-title">OPCIONES</h2>
                
                <div class="options-panel">
                    <div class="option-row">
                        <p class="option-label">Dificultad</p>
                        <div class="option-value">
                            <p v-if="difficulty === 'EASY'">FÁCIL</p>
                            <p v-if="difficulty === 'MEDIUM'">MEDIA</p>
                            <p v-if="difficulty === 'HARD'">DIFÍCIL</p>
                        </div>
                    </div>
                    
                    <div class="option-row">
                        <p class="option-label">MÚSICA</p>
                        <SwitchButton 
                            v-model="audio.isMusicOn.value" 
                            class="switch-container"
                            :class="{'bg-green-500': audio.isMusicOn.value, 'bg-red-500': !audio.isMusicOn.value}"
                        />
                    </div>
                    
                    <div class="option-row">
                        <p class="option-label">SONIDOS</p>
                        <SwitchButton 
                            v-model="audio.isSoundsOn.value" 
                            class="switch-container"
                            :class="{'bg-green-500': audio.isSoundsOn.value, 'bg-red-500': !audio.isSoundsOn.value}"
                        />
                    </div>
                </div>

                <article class="modal-buttons">
                    <div class="flex gap-4 flex-col md:flex-row">
                        <button 
                            @click="togglePause" 
                            class="modal-button bg-gradient-to-r from-green-600 to-green-800"
                        >
                            CONTINUAR
                        </button>
                        <button 
                            @click="menu" 
                            class="modal-button bg-gradient-to-r from-red-600 to-red-800"
                        >
                            SALIR
                        </button>
                    </div>
                </article>
            </div>
        </article>

        <!-- MODAL GAME OVER -->
        <article v-if="gameState.isGameOver.value">
            <div class="modal-overlay"></div>
            <div class="modal-container">
                <h2 class="modal-title">GAME OVER</h2>
                
                <div class="gameover-panel">
                    <div class="gameover-score">
                        <p class="gameover-label">Puntaje</p>
                        <div class="gameover-value">
                            <p>{{ gameState.score.value }}</p>
                        </div>
                    </div>
                    
                    <div v-if="!hasName" class="gameover-name-input">
                        <p class="gameover-label">Ingresa tu Nombre</p>
                        <div class="text-center">
                            <input 
                                v-model="player" 
                                class="name-input"
                                type="text" 
                                placeholder="Ingresa Nombre"
                                maxlength="20"
                            >
                        </div>
                        <div class="flex justify-center gap-4 mt-4">
                            <button 
                                @click="submitPlayerScore" 
                                class="modal-button bg-gradient-to-r from-green-600 to-green-800"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                    
                    <div v-else class="gameover-name-display">
                        <p class="gameover-label">Nombre</p>
                        <div class="gameover-name-value">
                            {{ player }}
                        </div>
                    </div>
                </div>

                <article v-if="hasName" class="modal-buttons">
                    <button 
                        @click="menu" 
                        class="modal-button-full bg-gradient-to-r from-red-600 to-red-800"
                    >
                        IR AL MENÚ
                    </button>
                    <button 
                        @click="restartGame" 
                        class="modal-button-full bg-gradient-to-r from-green-600 to-green-800"
                    >
                        VOLVER A JUGAR
                    </button>
                </article>
            </div>
        </article>
    </div>
</template>

<style scoped>
/* ============================================================================
   CONTENEDOR PRINCIPAL
   ============================================================================ */
.game-container {
    @apply w-screen flex items-center justify-center;
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
}
/*
LAYOUT MÓVIL HORIZONTAL
   ============================================================================ */
.mobile-layout {
    @apply w-full flex flex-col;
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
}

/* Área de juego (canvas + sidebar) */
.game-area {
    @apply flex flex-1;
    min-height: 0;
}

/* Canvas área (izquierda, 75% ancho) */
.mobile-canvas-area {
    @apply flex items-center justify-center p-2;
    width: 75%;
}

.game-canvas {
    max-width: 100%;
    max-height: 100%;
    width: auto !important;
    height: auto !important;
    border: 4px solid rgba(255, 255, 255, 0.8);
    border-radius: 0.75rem;
    box-shadow: 
      0 0 10px rgba(255, 255, 255, 0.3),
      inset 0 0 5px rgba(255, 255, 255, 0.2);
}

/* Panel derecho (vertical, 25% ancho) */
.mobile-sidebar {
    @apply flex flex-col gap-2 p-2 overflow-y-auto;
    width: 25%;
}

.stat-vertical {
    @apply p-2 border-2 rounded-lg text-center bg-gradient-to-r from-blue-600 to-blue-800;
    border-color: rgba(255, 255, 255, 0.8);
    box-shadow: 
      0 0 5px rgba(255, 255, 255, 0.3),
      inset 0 0 3px rgba(255, 255, 255, 0.2);
}

.stat-label-v {
    @apply block text-[9px] font-bold mb-1;
}

.stat-value-v {
    @apply block text-base font-extrabold leading-none;
}

.stat-value-v-small {
    @apply block text-xs font-bold leading-none;
}

.next-preview-vertical {
    @apply flex flex-col items-center gap-1;
}

.next-label {
    @apply text-[9px] font-bold;
}

/* ✅ CORREGIDO: Usar >>> en lugar de :deep() */
.next-preview-vertical >>> .next-piece-canvas-wrapper {
    padding: 0.25rem !important;
}

.next-preview-vertical >>> .next-piece-container {
    transform: scale(0.6);
}

.btn-options-vertical {
    @apply w-full py-1 rounded-lg deep-button text-[10px] font-bold;
    border: 2px solid rgba(255, 255, 255, 0.8);
    box-shadow: 
      0 0 5px rgba(255, 255, 255, 0.3),
      inset 0 0 3px rgba(255, 255, 255, 0.2);
}

/* ============================================================================
   ÁREA DE CONTROLES (NUEVO)
   ============================================================================ */
.controls-area {
    @apply flex items-center justify-center;
    height: 140px;
    background: linear-gradient(to bottom, 
        transparent 0%, 
        rgba(0, 0, 0, 0.3) 20%,
        rgba(0, 0, 0, 0.5) 100%);
    padding-bottom: env(safe-area-inset-bottom, 0);
}

.mobile-controls {
    @apply flex justify-around items-center w-full px-8 select-none;
}

/* ============================================================================
   D-PAD (NUEVO DISEÑO)
   ============================================================================ */
.dpad-container {
    @apply relative;
}

.dpad-zone {
    @apply relative rounded-xl;
    width: 140px;
    height: 140px;
    background: linear-gradient(135deg, 
        rgba(30, 41, 59, 0.95) 0%, 
        rgba(15, 23, 42, 0.95) 100%);
    border: 3px solid rgba(59, 130, 246, 0.5);
    box-shadow: 
        0 8px 16px rgba(0, 0, 0, 0.4),
        inset 0 2px 4px rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
}

.dpad-visual {
    @apply relative w-full h-full;
}

.dpad-arrow {
    @apply absolute flex items-center justify-center text-3xl font-bold;
    color: rgba(59, 130, 246, 0.8);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    width: 50px;
    height: 50px;
    transition: all 0.1s ease;
}

.dpad-left {
    left: 0;
    top: 50%;
    transform: translateY(-50%);
}

.dpad-right {
    right: 0;
    top: 50%;
    transform: translateY(-50%);
}

.dpad-up {
    top: 0;
    left: 50%;
    transform: translateX(-50%);
}

.dpad-down {
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
}

.dpad-center {
    @apply absolute rounded-full;
    width: 30px;
    height: 30px;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle, 
        rgba(59, 130, 246, 0.3) 0%, 
        rgba(59, 130, 246, 0.1) 70%,
        transparent 100%);
    border: 2px solid rgba(59, 130, 246, 0.3);
}

/* ============================================================================
   ZONAS DIAGONALES (INVISIBLES)
   ============================================================================ */
.dpad-diagonal {
    @apply absolute;
    width: 45px;
    height: 45px;
    /* Invisible pero funcional */
    background: transparent;
    /* Debug: descomentar para ver las zonas
    background: rgba(255, 0, 0, 0.2);
    border: 1px dashed red;
    */
    z-index: 10;
}

.dpad-down-left {
    bottom: 5px;
    left: 5px;
    border-radius: 0 0 0 8px;
}

.dpad-down-right {
    bottom: 5px;
    right: 5px;
    border-radius: 0 0 8px 0;
}

/* Feedback visual al presionar (opcional) */
.dpad-diagonal:active {
    background: rgba(59, 130, 246, 0.2);
}

/* ============================================================================
   BOTÓN ROTAR (NUEVO)
   ============================================================================ */
.btn-rotate-new {
    @apply relative rounded-full flex items-center justify-center;
    width: 100px;
    height: 100px;
    background: linear-gradient(135deg, 
        rgba(16, 185, 129, 0.95) 0%, 
        rgba(5, 150, 105, 0.95) 100%);
    border: 4px solid rgba(255, 255, 255, 0.3);
    box-shadow: 
        0 8px 16px rgba(0, 0, 0, 0.4),
        inset 0 2px 4px rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    transition: all 0.15s ease;
}

.btn-rotate-new:active {
    transform: scale(0.95) rotate(30deg);
    box-shadow: 
        0 4px 8px rgba(0, 0, 0, 0.5),
        inset 0 4px 8px rgba(0, 0, 0, 0.3);
}

.rotate-icon {
    @apply text-6xl font-bold;
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

/* ============================================================================
   LAYOUT DESKTOP (sin cambios)
   ============================================================================ */
.desktop-layout {
    @apply flex gap-4 items-start justify-center p-4;
}

.desktop-left-panel,
.desktop-right-panel {
    @apply flex flex-col gap-4;
}

.desktop-canvas {
    @apply grid place-items-center;
}

.score-display,
.time-display {
    @apply p-2 border-4 rounded-xl relative w-32 mt-4 text-center bg-gradient-to-r from-blue-600 to-blue-800 grid items-center;
    border-color: rgba(255, 255, 255, 0.8);
    box-shadow: 
      0 0 10px rgba(255, 255, 255, 0.3),
      inset 0 0 5px rgba(255, 255, 255, 0.2);
}

.score-label,
.time-label {
    @apply absolute top-0 -mt-4 font-bold left-0 right-0 mx-auto select-none;
}

.score-value {
    @apply text-3xl font-extrabold;
}

.time-value {
    @apply text-xl font-bold;
}

.deep-button {
    background: linear-gradient(145deg, lightgray, white, white, lightgray);
    box-shadow: 
      5px 5px 15px rgba(0, 0, 0, 0.4), 
      inset 1px 1px 5px rgba(255, 255, 255, 0.7), 
      inset -1px -1px 5px rgba(0, 0, 0, 0.4);
    color: #333;
    cursor: pointer;
    font-weight: 700;
    user-select: none;
    transition: all 0.3s ease;
}

.deep-button:hover {
    box-shadow: 
      5px 5px 15px rgba(0, 0, 0, 0.4), 
      inset 1px 1px 5px rgba(255, 255, 255, 0.7), 
      inset -1px -1px 5px rgba(0, 0, 0, 0.4);
}

.deep-button:active {
    box-shadow: 
      inset 2px 2px 5px rgba(0, 0, 0, 0.4), 
      inset 1px 1px 5px rgba(255, 255, 255, 0.7);
}

/* ============================================================================
   MODALES (sin cambios)
   ============================================================================ */
.modal-overlay {
    @apply w-screen h-screen absolute bg-gray-800 opacity-90 z-10 left-0 top-0;
}

.modal-container {
    @apply absolute left-0 top-0 h-full w-full z-10 grid items-center justify-center;
}

.modal-title {
    @apply font-bold text-3xl text-gray-300 text-center mb-4 p-4;
}

.options-panel {
    @apply grid gap-6 shadow border p-4 rounded-xl text-sm bg-gradient-to-r from-gray-400 to-gray-500;
    border-color: rgba(255, 255, 255, 0.8);
    box-shadow: 
      0 0 10px rgba(255, 255, 255, 0.3),
      inset 0 0 5px rgba(255, 255, 255, 0.2);
}

.option-row {
    @apply grid grid-cols-2 gap-4 items-center text-xl;
}

.option-label {
    @apply font-bold uppercase;
}

.option-value {
    @apply text-right;
}

.switch-container {
    @apply p-2 rounded-xl flex gap-4 items-center justify-between;
    border-color: rgba(255, 255, 255, 0.8);
    box-shadow: 
      0 0 10px rgba(255, 255, 255, 0.3),
      inset 0 0 5px rgba(255, 255, 255, 0.2);
}

.modal-buttons {
    @apply flex gap-4 flex-col items-center justify-center;
}

.modal-button {
    @apply text-xl md:text-2xl border rounded-2xl p-4 w-72 md:w-[17rem] font-extrabold;
    border-color: rgba(255, 255, 255, 0.8);
    box-shadow: 
      0 0 10px rgba(255, 255, 255, 0.3),
      inset 0 0 5px rgba(255, 255, 255, 0.2);
}

.modal-button-full {
    @apply text-xl md:text-2xl border rounded-2xl p-3 w-72 md:w-[35rem] font-extrabold;
    border-color: rgba(255, 255, 255, 0.8);
    box-shadow: 
      0 0 10px rgba(255, 255, 255, 0.3),
      inset 0 0 5px rgba(255, 255, 255, 0.2);
}

.gameover-panel {
    @apply grid gap-8 shadow border p-4 py-8 rounded-xl text-sm bg-gradient-to-r from-blue-600 to-blue-800;
    border-color: rgba(255, 255, 255, 0.8);
    box-shadow: 
      0 0 10px rgba(255, 255, 255, 0.3),
      inset 0 0 5px rgba(255, 255, 255, 0.2);
}

.gameover-score {
    @apply grid justify-center gap-4 items-center text-xl;
}

.gameover-label {
    @apply text-center font-bold uppercase;
}

.gameover-value {
    @apply text-center font-bold text-5xl;
}

.gameover-name-input {
    @apply grid justify-center gap-4 items-center text-xl;
}

.name-input {
    @apply text-center text-orange-500 rounded-xl w-72 bg-gradient-to-r from-yellow-100 to-orange-100 font-extrabold p-2;
    border: 2px solid rgba(255, 255, 255, 0.8);
    box-shadow: 
      0 0 10px rgba(255, 255, 255, 0.3),
      inset 0 0 5px rgba(255, 255, 255, 0.2);
}

.gameover-name-display {
    @apply grid justify-center gap-4 items-center text-xl;
}

.gameover-name-value {
    @apply p-4 text-5xl text-center font-bold;
}
</style>