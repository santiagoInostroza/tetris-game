import { formatTime } from '/src/utils/helpers.js';
import { checkCollision } from '/src/utils/helpers.js';

/**
 * Composable para manejar el game loop
 */
export function useGameLoop(gameState, bonus, audio) {
    let animationFrameId = null;

    /**
     * Inicia el game loop
     */
    function startLoop(drawCallback, autoDropCallback) {
        gameState.isPaused.value = false;
        gameState.isGameOver.value = false;
        animationFrameId = window.requestAnimationFrame((timestamp) => 
            update(timestamp, drawCallback, autoDropCallback)
        );
        audio.startMusic();
        bonus.resetBonus();
    }

    /**
     * Pausa el game loop
     */
    function pauseLoop() {
        if (animationFrameId) {
            window.cancelAnimationFrame(animationFrameId);
        }
        gameState.isPaused.value = true;
        audio.pauseAudio();
    }

    /**
     * Reanuda el game loop
     */
    function resumeLoop(drawCallback, autoDropCallback) {
        const timeState = gameState.getTimeState();
        gameState.setTimeState(
            timeState.activeGameTime,
            performance.now(),
            timeState.dropCounter
        );
        
        animationFrameId = window.requestAnimationFrame((timestamp) => 
            update(timestamp, drawCallback, autoDropCallback)
        );
        gameState.isPaused.value = false;
        audio.resumeAudio();
    }

    /**
     * Detiene el game loop
     */
    function stopLoop() {
        if (animationFrameId) {
            window.cancelAnimationFrame(animationFrameId);
        }
        audio.stopMusic();
    }

    /**
     * Loop principal del juego
     */
    function update(timestamp, drawCallback, autoDropCallback) {
        if (gameState.isPaused.value) {
            return;
        }

        const timeState = gameState.getTimeState();
        
        if (timeState.lastUpdateTime === 0) {
            gameState.setTimeState(timeState.activeGameTime, timestamp, timeState.dropCounter);
            timeState.lastUpdateTime = timestamp;
        }

        const deltaTime = timestamp - timeState.lastUpdateTime;
        const newActiveTime = timeState.activeGameTime + deltaTime;
        
        // Actualizar tiempo mostrado
        const secondsElapsed = Math.floor(newActiveTime / 1000);
        gameState.time.value = formatTime(secondsElapsed);

        // Auto-drop de pieza
        let newDropCounter = timeState.dropCounter + deltaTime;
        if (newDropCounter > 1000) {
            // Ejecutar el auto-drop
            autoDropCallback();
            newDropCounter = 0; // Resetear contador
        }

        // Actualizar estado del tiempo
        gameState.setTimeState(newActiveTime, timestamp, newDropCounter);

        // Dibujar
        drawCallback(deltaTime);

        // Continuar loop
        if (!gameState.isGameOver.value) {
            animationFrameId = window.requestAnimationFrame((ts) => 
                update(ts, drawCallback, autoDropCallback)
            );
        }
    }

    return {
        startLoop,
        pauseLoop,
        resumeLoop,
        stopLoop
    };
}