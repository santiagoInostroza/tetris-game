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
    let currentLine = 0;
    
    function removeNextLine() {
        if (currentLine >= linePositions.length) {
            // Todas las líneas procesadas
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
        
        // Remover línea
        bonus.removeLine(gameState.board, y);
        
        // Calcular score
        const multiplier = bonus.getMultiplier();
        const lineScore = ((currentLine + 1) * BOARD_WIDTH) * (1 + (currentLine * 0.25)) * multiplier;
        
        bonus.showLineScore(y, lineScore);
        bonus.playLineSound(currentLine);
        
        // Actualizar score total en la última línea
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
    <div class="grid justify-center">

        <!-- SCORE AND TIME - MOBILE -->
        <article v-if="ISMOBILE" class="shadow rounded py-2">
            <div class="flex justify-between w-screen px-4">
                <!-- SCORE-->
                <div class="score-display">
                    <span class="score-label">Puntaje</span>
                    <span class="score-value">{{ gameState.score.value }}</span>
                </div>
                <!-- TIME -->
                <div class="time-display">
                    <span class="time-label">Tiempo</span>
                    <span class="time-value">{{ gameState.time.value }}</span>
                </div>
            </div>
        </article>        

        <div class="flex gap-4">
            <!-- SCORE - DESKTOP -->
            <div v-if="!ISMOBILE">
                <div class="score-display">
                    <span class="score-label">Puntaje</span>
                    <span class="score-value">{{ gameState.score.value }}</span>
                </div>
                <!-- ⭐ NUEVO: Próxima pieza (desktop) -->
                <NextPiecePreview :nextPiece="gameState.nextPiece" />
            </div> 
            
            <!-- CANVAS -->
            <article class="grid justify-center mt-2 w-full" :style="{ height: HEIGHT_CANVAS + 'px' }">
                <div>
                    <canvas class="border-shine rounded-xl bg-blue-400" ref="canvas"></canvas>
                </div>
            </article>
            
            <!-- TIME - DESKTOP -->
            <div v-if="!ISMOBILE">
                <div class="grid gap-4">
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

        <article v-if="ISMOBILE" class="mobile-next-piece">
            <NextPiecePreview :nextPiece="gameState.nextPiece" />
        </article>
        
        <!-- JOYSTICK - MOBILE -->
        <article 
            v-if="ISMOBILE" 
            id="buttons_movil" 
            class="flex justify-between items-stretch my-5 gap-4 px-4 select-none"
            @contextmenu.prevent
        >
            <div class="h-50 w-50">
                <div class="flex-between">
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
                <div class="grid justify-center -mt-4">
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
            
            <div class="grid content-between justify-end">
                <button 
                    @click="togglePause" 
                    class="w-16 h-6 rounded-xl deep-button border-shine -ml-4" 
                    style="font-size: 12px;"
                >
                    OPCIONES
                </button>
                
                <div class="ml-12">
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
                    class="joystick-button-large rotate-180 grid -ml-4" 
                    aria-label="Rotar pieza"
                >
                    ↻
                </button>
            </div>
        </article>            
    </div>

    <!-- MODALES -->
    <div>
        <!-- MODAL PAUSA -->
        <article v-if="gameState.isPaused.value && !gameState.isGameOver.value">
            <div class="modal-overlay"></div>
            <div class="modal-container">
                <h2 class="modal-title">OPCIONES</h2>
                
                <div class="options-panel">
                    <!-- Dificultad -->
                    <div class="option-row">
                        <p class="option-label">Dificultad</p>
                        <div class="option-value">
                            <p v-if="DIFFICULTY.value === 'EASY'">FÁCIL</p>
                            <p v-if="DIFFICULTY.value === 'MEDIUM'">MEDIA</p>
                            <p v-if="DIFFICULTY.value === 'HARD'">DIFÍCIL</p>
                        </div>
                    </div>
                    
                    <!-- Música -->
                    <div class="option-row">
                        <p class="option-label">MÚSICA</p>
                        <SwitchButton 
                            v-model="audio.isMusicOn.value" 
                            class="switch-container"
                            :class="{'bg-green-500': audio.isMusicOn.value, 'bg-red-500': !audio.isMusicOn.value}"
                        />
                    </div>
                    
                    <!-- Sonidos -->
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
                    <!-- Score -->
                    <div class="gameover-score">
                        <p class="gameover-label">Puntaje</p>
                        <div class="gameover-value">
                            <p>{{ gameState.score.value }}</p>
                        </div>
                    </div>
                    
                    <!-- Input Nombre -->
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
                    
                    <!-- Mostrar Nombre -->
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
   BOTONES 3D - Usar clase .deep-button directamente en el template
   ============================================================================ */

/* ============================================================================
   DISPLAYS DE SCORE Y TIEMPO
   ============================================================================ */
.score-display,
.time-display {
    @apply p-2 border-4 rounded-xl relative w-32 mt-4 text-center bg-gradient-to-r from-blue-600 to-blue-800 grid items-center;
    /* Aplicar border-shine manualmente */
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
   JOYSTICK BUTTONS
   ============================================================================ */
.joystick-button {
    @apply text-7xl w-20 h-20 rounded-full;
    /* deep-button styles */
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
    /* border-shine */
    border: 4px solid rgba(255, 255, 255, 0.8);
}

.joystick-button:hover {
    box-shadow: 
      5px 5px 15px rgba(0, 0, 0, 0.4), 
      inset 1px 1px 5px rgba(255, 255, 255, 0.7), 
      inset -1px -1px 5px rgba(0, 0, 0, 0.4);
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

/* ============================================================================
   PANEL DE OPCIONES
   ============================================================================ */
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

/* ============================================================================
   BOTONES DE MODAL
   ============================================================================ */
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

/* ============================================================================
   GAME OVER PANEL
   ============================================================================ */
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

.desktop-left-panel {
    @apply flex flex-col gap-4;
}

.mobile-next-piece {
    @apply flex justify-center mt-4 px-4;
}
</style>