<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { ISMOBILE, HEIGHT_CANVAS, BLOCK_SIZE, BOARD_WIDTH, BOARD_HEIGHT, DIRECTIONS } from '/src/utils/consts.js';
import { checkCollision } from '/src/utils/helpers.js';
import { difficulty } from '/src/utils/config.js';
import { name } from '/src/utils/player.js';
import { PIECES_IMAGES } from '/src/utils/images.js';

import { handleKeyDown, handleKeyUp, movePiece, speedDown, continueMovement } from '/src/utils/keyboardControls.js';
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
const isSavingScore = ref(false); 

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
    if (!player.value || isSavingScore.value) return; // ✅ Prevenir doble guardado
    
    isSavingScore.value = true; // ✅ Marcar como guardando
    hasName.value = true;
    
    try {
        const newPlayer = {
            name: player.value,
            score: gameState.score.value,
            time: gameState.time.value,
            difficulty: difficulty.value,
        };
        
        await createPlayer(newPlayer);
        console.log('✅ Puntaje guardado correctamente');
    } catch (error) {
        console.error("Error al agregar el puntaje:", error);
        isSavingScore.value = false; // ✅ Resetear en caso de error
    }
    // No reseteamos isSavingScore en success para evitar re-guardado
}

function restartGame() {
    gameState.resetGameState();
    bonus.resetBonus();
    isSavingScore.value = false; // ✅ Resetear al reiniciar
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

function stopAllMovements() {
    Object.keys(movementStates).forEach(key => {
        movementStates[key] = false;
    });
    isTouching = false;
}

// ============================================================================
// HARD DROP
// ============================================================================

function handleHardDrop() {
    if (gameState.isPaused.value || gameState.isGameOver.value) return;
    
    speedDown(
        gameState.board, 
        gameState.piece, 
        { solidifyPiece, removeLines, updateDropCounter: gameState.updateDropCounter }
    );
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
                    <!-- D-Pad de 4 direcciones (SIN botón arriba) -->
                    <div class="dpad-container">
                        <div class="dpad-grid-cross">
                            <!-- Fila superior -->
                            <div class="dpad-cell empty"></div>
                            <div class="dpad-cell empty"></div>
                            <div class="dpad-cell empty"></div>

                            <!-- Fila media -->
                            <button 
                                @touchstart.prevent="startMovement(DIRECTIONS.LEFT)"
                                @touchend.prevent="stopMovement(DIRECTIONS.LEFT)"
                                @touchcancel.prevent="stopMovement(DIRECTIONS.LEFT)"
                                @mousedown.prevent="startMovement(DIRECTIONS.LEFT)"
                                @mouseup="stopMovement(DIRECTIONS.LEFT)"
                                @mouseleave="stopMovement(DIRECTIONS.LEFT)"
                                @contextmenu.prevent
                                class="dpad-cell dpad-btn dpad-left"
                            >
                                <span class="dpad-icon">◀</span>
                            </button>
                            <div class="dpad-cell dpad-center-dot"></div>
                            <button 
                                @touchstart.prevent="startMovement(DIRECTIONS.RIGHT)"
                                @touchend.prevent="stopMovement(DIRECTIONS.RIGHT)"
                                @touchcancel.prevent="stopMovement(DIRECTIONS.RIGHT)"
                                @mousedown.prevent="startMovement(DIRECTIONS.RIGHT)"
                                @mouseup="stopMovement(DIRECTIONS.RIGHT)"
                                @mouseleave="stopMovement(DIRECTIONS.RIGHT)"
                                @contextmenu.prevent
                                class="dpad-cell dpad-btn dpad-right"
                            >
                                <span class="dpad-icon">▶</span>
                            </button>

                            <!-- Fila inferior -->
                            <div class="dpad-cell empty"></div>
                            <button 
                                @touchstart.prevent="startMovement(DIRECTIONS.DOWN)"
                                @touchend.prevent="stopMovement(DIRECTIONS.DOWN)"
                                @touchcancel.prevent="stopMovement(DIRECTIONS.DOWN)"
                                @mousedown.prevent="startMovement(DIRECTIONS.DOWN)"
                                @mouseup="stopMovement(DIRECTIONS.DOWN)"
                                @mouseleave="stopMovement(DIRECTIONS.DOWN)"
                                @contextmenu.prevent
                                class="dpad-cell dpad-btn dpad-down"
                            >
                                <span class="dpad-icon">▼</span>
                            </button>
                            <div class="dpad-cell empty"></div>
                        </div>
                    </div>

                    <!-- Botones de acción -->
                    <div class="action-buttons">
                        <!-- Botón BAJAR -->
                        <button 
                            @touchstart.prevent="handleHardDrop"
                            @touchend.prevent="stopAllMovements"
                            @touchcancel.prevent="stopAllMovements"
                            @mousedown.prevent="handleHardDrop"
                            @contextmenu.prevent
                            class="btn-action btn-drop" 
                            aria-label="Bajar rápido"
                        >
                            <span class="action-icon">⇣</span>
                            <span class="action-label">BAJAR</span>
                        </button>

                        <!-- Botón ROTAR -->
                        <button 
                            @touchstart.prevent="startMovement(DIRECTIONS.ROTATE)" 
                            @touchend.prevent="stopMovement(DIRECTIONS.ROTATE)"
                            @touchcancel.prevent="stopMovement(DIRECTIONS.ROTATE)"
                            @mousedown.prevent="startMovement(DIRECTIONS.ROTATE)"
                            @mouseup="stopMovement(DIRECTIONS.ROTATE)"
                            @mouseleave="stopMovement(DIRECTIONS.ROTATE)"
                            @contextmenu.prevent
                            class="btn-action btn-rotate" 
                            aria-label="Rotar pieza"
                        >
                            <span class="action-icon">↻</span>
                            <span class="action-label">ROTAR</span>
                        </button>
                    </div>
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

/* ============================================================================
   LAYOUT MÓVIL HORIZONTAL
   ============================================================================ */
.mobile-layout {
    @apply w-full flex flex-col;
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
}

.game-area {
    @apply flex flex-1;
    min-height: 0;
}

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
   ÁREA DE CONTROLES
   ============================================================================ */
.controls-area {
    @apply flex items-center justify-center;
    height: 160px; /* ✅ Aumentado de 140px a 160px */
    background: linear-gradient(to bottom, 
        transparent 0%, 
        rgba(0, 0, 0, 0.3) 20%,
        rgba(0, 0, 0, 0.5) 100%);
    padding-bottom: env(safe-area-inset-bottom, 0);
}

.mobile-controls {
    @apply flex justify-around items-center w-full px-4; /* ✅ Reducido padding de px-8 a px-4 */
}

/* ============================================================================
   D-PAD EN CRUZ (SIN BOTÓN ARRIBA)
   ============================================================================ */
.dpad-container {
    @apply relative;
}

.dpad-grid-cross {
    display: grid;
    grid-template-columns: repeat(3, 60px);
    grid-template-rows: repeat(3, 60px);
    gap: 4px;
    background: rgba(15, 23, 42, 0.9);
    padding: 8px;
    border-radius: 16px;
    border: 3px solid rgba(59, 130, 246, 0.4);
    box-shadow: 
        0 10px 20px rgba(0, 0, 0, 0.5),
        inset 0 2px 4px rgba(255, 255, 255, 0.08);
}

.dpad-cell {
    @apply relative flex items-center justify-center;
    border-radius: 8px;
}

.dpad-btn {
    background: linear-gradient(135deg, 
        rgba(37, 99, 235, 0.95) 0%, 
        rgba(29, 78, 216, 0.95) 100%);
    border: 3px solid rgba(96, 165, 250, 0.5);
    box-shadow: 
        0 4px 8px rgba(0, 0, 0, 0.3),
        inset 0 2px 4px rgba(255, 255, 255, 0.15);
    transition: all 0.12s ease;
    touch-action: none; /* ✅ Prevenir scroll mientras se presiona */
}

.dpad-btn:active {
    background: linear-gradient(135deg, 
        rgba(29, 78, 216, 1) 0%, 
        rgba(30, 64, 175, 1) 100%);
    box-shadow: 
        inset 0 3px 6px rgba(0, 0, 0, 0.5);
    transform: scale(0.92);
}

.dpad-icon {
    @apply text-3xl font-bold;
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
    user-select: none;
    pointer-events: none; /* ✅ Evitar que el icono capture eventos */
}

.empty {
    background: transparent;
}

.dpad-center-dot {
    background: radial-gradient(circle, 
        rgba(59, 130, 246, 0.5) 0%, 
        rgba(59, 130, 246, 0.15) 50%,
        transparent 100%);
    border: 2px solid rgba(59, 130, 246, 0.3);
}

/* ============================================================================
   BOTONES DE ACCIÓN
   ============================================================================ */
.action-buttons {
    @apply flex flex-col gap-3;
}

.btn-action {
    @apply relative rounded-2xl flex flex-col items-center justify-center gap-1;
    width: 110px;
    height: 65px;
    border: 3px solid rgba(255, 255, 255, 0.4);
    box-shadow: 
        0 8px 16px rgba(0, 0, 0, 0.4),
        inset 0 2px 4px rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    transition: all 0.15s ease;
    touch-action: none; /* ✅ Prevenir scroll */
}

.btn-action:active {
    transform: scale(0.93);
    box-shadow: 
        0 4px 8px rgba(0, 0, 0, 0.5),
        inset 0 4px 8px rgba(0, 0, 0, 0.3);
}

.btn-drop {
    background: linear-gradient(135deg, 
        rgba(239, 68, 68, 0.95) 0%, 
        rgba(220, 38, 38, 0.95) 100%);
}

.btn-drop:active {
    background: linear-gradient(135deg, 
        rgba(220, 38, 38, 1) 0%, 
        rgba(185, 28, 28, 1) 100%);
}

.btn-rotate {
    background: linear-gradient(135deg, 
        rgba(16, 185, 129, 0.95) 0%, 
        rgba(5, 150, 105, 0.95) 100%);
}

.btn-rotate:active {
    background: linear-gradient(135deg, 
        rgba(5, 150, 105, 1) 0%, 
        rgba(4, 120, 87, 1) 100%);
}

.action-icon {
    @apply text-4xl font-bold leading-none;
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
    pointer-events: none; /* ✅ Evitar que el icono capture eventos */
}

.action-label {
    @apply text-xs font-bold tracking-wider;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    pointer-events: none; /* ✅ Evitar que el label capture eventos */
}

/* ============================================================================
   LAYOUT DESKTOP
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
   MODALES
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