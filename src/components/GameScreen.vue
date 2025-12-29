<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
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
    isMovingspace: false,
};
let isTouching = false;

// ============================================================================
// LIFECYCLE
// ============================================================================

onMounted(() => {
    initializeCanvas();
    initializePlayer();
    
    // ✅ Inicializar pieza ANTES de empezar el loop
    gameState.initializePiece();
    
    setupEventListeners();
    setupBrowserBehavior();
    
    // Iniciar el loop después de tener todo listo
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
    // Prevenir salida accidental
    window.onbeforeunload = () => '¿Estás seguro de que deseas abandonar esta página?';
    
    // Prevenir navegación atrás
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

/**
 * Solidifica la pieza actual en el tablero
 */
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
    
    // Nueva pieza
    gameState.initializePiece();
    
    // Verificar game over
    if (checkCollision(gameState.board, gameState.piece)) {
        endGame();
    }
}

/**
 * Remueve líneas completadas
 */
function removeLines() {
    const result = bonus.processCompletedLines(gameState.board);
    
    if (result.lineCount === 0) return;
    
    // Procesar eliminación de líneas con animación
    processLineRemoval(result.linePositions, result.totalBonus);
}

/**
 * Procesa la eliminación de líneas una por una
 */
function processLineRemoval(linePositions, totalBonus) {
    console.log('📊 Líneas:', linePositions.length, 'Total Bonus:', totalBonus); // ← AÑADIR
    
    let currentLine = 0;
    
    function removeNextLine() {
        if (currentLine >= linePositions.length) {
            if (totalBonus > 0) {
                console.log('🎉 Iniciando animación de bonus:', totalBonus); // ← AÑADIR
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
        
        // Remover línea
        bonus.removeLine(gameState.board, y);
        
        // Calcular score
        const multiplier = bonus.getMultiplier();
        const lineScore = ((currentLine + 1) * BOARD_WIDTH) * (1 + (currentLine * 0.25)) * multiplier;
        
        console.log(`📍 Línea ${currentLine + 1}: score=${lineScore}, multiplier=${multiplier}`); // ← AÑADIR
        
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

/**
 * Finaliza el juego
 */
function endGame() {
    gameState.isGameOver.value = true;
    pause();
    audio.stopMusic();
    
    if (hasName.value && gameState.score.value > 0) {
        submitPlayerScore();
    }
}

/**
 * Envía el puntaje del jugador al servidor
 */
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

/**
 * Reinicia el juego
 */
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
// RENDERIZADO
// ============================================================================

/**
 * Dibuja el estado actual del juego
 */
function draw(deltaTime) {
    // ✅ Validar que el context esté disponible
    if (!context.value || !canvas.value) {
        console.warn('Canvas context no disponible');
        return;
    }
    
    // Fondo
    context.value.fillStyle = 'black';
    context.value.fillRect(0, 0, canvas.value.width, canvas.value.height);
    
    // Tablero
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
    
    // Pieza actual
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
    
    // Score en líneas completadas
    if (bonus.showScoreOnLine.value) {
        showScoreOnCompletedLines(context.value, bonus.newScore.value, bonus.linePosition.value);
    }
    
    // Bonus animation
    if (bonus.showBonus.value) {
        bonus.remainingBonusTime.value -= deltaTime;
        drawBonus(
            context.value,
            bonus.textBonus.value,
            bonus.remainingBonusTime.value,
            bonus.timeBonus.value
        );
    }
    
    // Movimiento continuo (táctil)
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
            <!-- Header: Score, Tiempo, Próxima Pieza -->
            <div class="mobile-header">
                <!-- Lado izquierdo: Score y Tiempo -->
                <div class="mobile-stats-left">
                    <div class="stat-box-compact">
                        <span class="stat-label-compact">Puntaje</span>
                        <span class="stat-value-compact">{{ gameState.score.value }}</span>
                    </div>
                    <div class="stat-box-compact">
                        <span class="stat-label-compact">Tiempo</span>
                        <span class="stat-value-compact-small">{{ gameState.time.value }}</span>
                    </div>
                </div>
                
                <!-- Lado derecho: Próxima Pieza -->
                <div class="mobile-next-preview-right">
                    <NextPiecePreview :nextPiece="gameState.nextPiece" />
                </div>
            </div>

            <!-- Canvas -->
            <div class="mobile-canvas">
                <canvas class="border-shine rounded-xl bg-blue-400" ref="canvas"></canvas>
            </div>

            <!-- Controles -->
            <div class="mobile-controls" @contextmenu.prevent>
                <div class="controls-left">
                    <div class="dpad-row">
                        <button  
                            @touchstart.prevent="startMovement(DIRECTIONS.LEFT)"  
                            @touchend.prevent="stopMovement(DIRECTIONS.LEFT)"
                            @mousedown.prevent="startMovement(DIRECTIONS.LEFT)"
                            @mouseup="stopMovement(DIRECTIONS.LEFT)"
                            @mouseleave="stopMovement(DIRECTIONS.LEFT)"
                            @contextmenu.prevent
                            class="joystick-button rotate-90"
                            aria-label="Mover izquierda"
                        >
                            ▼
                        </button>
                        
                        <button  
                            @touchstart.prevent="startMovement(DIRECTIONS.RIGHT)" 
                            @touchend.prevent="stopMovement(DIRECTIONS.RIGHT)"
                            @mousedown.prevent="startMovement(DIRECTIONS.RIGHT)"
                            @mouseup="stopMovement(DIRECTIONS.RIGHT)"
                            @mouseleave="stopMovement(DIRECTIONS.RIGHT)"
                            @contextmenu.prevent
                            class="joystick-button rotate-90 ml-[3rem]"
                            aria-label="Mover derecha"
                        >
                            ▲
                        </button>
                    </div>
                    <div class="dpad-down">
                        <button 
                            @touchstart.prevent="startMovement(DIRECTIONS.DOWN)" 
                            @touchend.prevent="stopMovement(DIRECTIONS.DOWN)"
                            @mousedown.prevent="startMovement(DIRECTIONS.DOWN)"
                            @mouseup="stopMovement(DIRECTIONS.DOWN)"
                            @mouseleave="stopMovement(DIRECTIONS.DOWN)"
                            @contextmenu.prevent
                            class="joystick-button"
                            aria-label="Mover abajo"
                        >
                            ▼
                        </button>
                    </div>
                </div>
                
                <div class="controls-right">
                    <button 
                        @click="togglePause" 
                        class="btn-options"
                    >
                        OPCIONES
                    </button>
                    
                    <div class="action-buttons">
                        <button 
                            @touchstart.prevent="startMovement('space')" 
                            @touchend.prevent="stopMovement('space')"
                            @mousedown.prevent="startMovement('space')"
                            @mouseup="stopMovement('space')"
                            @mouseleave="stopMovement('space')"
                            @contextmenu.prevent
                            class="joystick-button-small grid"
                            aria-label="Caída rápida"
                        >
                            <span class="mt-1">▼</span>
                            <span class="-mt-4">▼</span>
                        </button>
                    </div>
                    
                    <button 
                        @touchstart.prevent="startMovement(DIRECTIONS.ROTATE)" 
                        @touchend.prevent="stopMovement(DIRECTIONS.ROTATE)"
                        @mousedown.prevent="startMovement(DIRECTIONS.ROTATE)"
                        @mouseup="stopMovement(DIRECTIONS.ROTATE)"
                        @mouseleave="stopMovement(DIRECTIONS.ROTATE)"
                        @contextmenu.prevent
                        class="joystick-button-large rotate-180 grid" 
                        aria-label="Rotar pieza"
                    >
                        ↻
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

    <!-- MODALES (sin cambios) -->
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
    @apply min-h-screen flex items-center justify-center;
}

/* ============================================================================
   LAYOUT MÓVIL
   ============================================================================ */
.mobile-layout {
    @apply w-screen flex flex-col;
    height: 100vh;
    height: 100dvh; /* Dynamic viewport height para móviles */
    overflow: hidden; /* Evitar scroll */
}

.mobile-header {
    @apply px-2 pt-1 pb-1 flex justify-between items-start gap-2;
    /* ✅ CAMBIO: Reducir padding vertical */
}

/* Stats compactos a la izquierda */
.mobile-stats-left {
    @apply flex flex-col gap-1 flex-shrink-0;
}

.stat-box-compact {
    @apply p-1 px-2 border-2 rounded-lg relative text-center bg-gradient-to-r from-blue-600 to-blue-800;
    border-color: rgba(255, 255, 255, 0.8);
    box-shadow: 
      0 0 5px rgba(255, 255, 255, 0.3),
      inset 0 0 3px rgba(255, 255, 255, 0.2);
    min-width: 80px;
}

.stat-label-compact {
    @apply block text-[10px] font-bold mb-0.5;
}

.stat-value-compact {
    @apply block text-lg font-extrabold leading-none;
}

.stat-value-compact-small {
    @apply block text-sm font-bold leading-none;
}

/* Próxima pieza a la derecha */
.mobile-next-preview-right {
    @apply flex-1 flex justify-end items-start;
    max-width: 60%;
}

.mobile-next-preview-right :deep(.next-piece-container) {
    transform: scale(0.8); /* ✅ CAMBIO: Un poco más pequeño */
    transform-origin: top right;
}

.mobile-next-preview-right :deep(.next-piece-title) {
    @apply text-sm;
}

.mobile-next-preview-right :deep(.next-piece-canvas-wrapper) {
    padding: 0.5rem; /* ✅ CAMBIO: Reducir padding interno */
}

.mobile-canvas {
    @apply flex-1 flex items-center justify-center px-2 py-1;
    /* ✅ CAMBIO: Reducir padding vertical */
    min-height: 0; /* Importante para flex */
}

.mobile-canvas canvas {
    max-width: 100%;
    max-height: 100%;
    width: auto !important;
    height: auto !important;
}

.mobile-controls {
    @apply flex justify-between items-stretch gap-4 px-4 select-none;
    /* ✅ CAMBIO: Más padding abajo para evitar que se corte */
    padding-top: 0.5rem;
    padding-bottom: max(1.5rem, calc(env(safe-area-inset-bottom) + 0.5rem));
}

.controls-left {
    @apply flex flex-col;
}

.dpad-row {
    @apply flex gap-12;
}

.dpad-down {
    @apply grid justify-center -mt-4;
}

.controls-right {
    @apply grid gap-2 items-center justify-items-end;
    grid-template-rows: auto 1fr auto;
}

.btn-options {
    @apply w-16 h-6 rounded-xl deep-button text-xs font-bold;
    /* border-shine aplicado manualmente */
    border: 4px solid rgba(255, 255, 255, 0.8);
    box-shadow: 
      0 0 10px rgba(255, 255, 255, 0.3),
      inset 0 0 5px rgba(255, 255, 255, 0.2);
}

.action-buttons {
    @apply flex items-center;
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

/* ============================================================================
   DISPLAYS (DESKTOP)
   ============================================================================ */
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

/* ============================================================================
   BOTONES 3D
   ============================================================================ */
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
   JOYSTICK BUTTONS
   ============================================================================ */
.joystick-button {
    @apply text-7xl w-20 h-20 rounded-full;
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
    border: 4px solid rgba(255, 255, 255, 0.8);
}

.joystick-button:active {
    box-shadow: 
      inset 2px 2px 5px rgba(0, 0, 0, 0.4), 
      inset 1px 1px 5px rgba(255, 255, 255, 0.7);
}

.joystick-button-small {
    @apply rounded-full w-12 h-12;
    background: linear-gradient(145deg, lightgray, white, white, lightgray);
    box-shadow: 
      5px 5px 15px rgba(0, 0, 0, 0.4), 
      inset 1px 1px 5px rgba(255, 255, 255, 0.7), 
      inset -1px -1px 5px rgba(0, 0, 0, 0.4);
    color: #333;
    cursor: pointer;
    font-weight: 700;
    user-select: none;
    border: 4px solid rgba(255, 255, 255, 0.8);
}

.joystick-button-large {
    @apply rounded-full w-16 h-16 text-4xl;
    background: linear-gradient(145deg, lightgray, white, white, lightgray);
    box-shadow: 
      5px 5px 15px rgba(0, 0, 0, 0.4), 
      inset 1px 1px 5px rgba(255, 255, 255, 0.7), 
      inset -1px -1px 5px rgba(0, 0, 0, 0.4);
    color: #333;
    cursor: pointer;
    font-weight: 700;
    user-select: none;
    border: 4px solid rgba(255, 255, 255, 0.8);
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