import { ISPRODUCTION } from './consts';
import { ref } from 'vue';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const DEFAULT_MUSIC_VOLUME = 0.2;
const DEFAULT_SOUND_VOLUME = 0.2;

// ============================================================================
// CLASE PARA MANEJAR AUDIO
// ============================================================================

class AudioManager {
    constructor(src, volume = 1, loop = false) {
        this.audio = new Audio(src);
        this.audio.volume = volume;
        this.audio.loop = loop;
        this.isPlaying = false;
    }

    play() {
        if (this.isPlaying) return;
        
        this.audio.currentTime = 0;
        this.audio.play()
            .then(() => {
                this.isPlaying = true;
            })
            .catch(error => {
                console.warn('Error al reproducir audio:', error);
            });
    }

    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.isPlaying = false;
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
    }

    resume() {
        this.audio.play()
            .then(() => {
                this.isPlaying = true;
            })
            .catch(error => {
                console.warn('Error al reanudar audio:', error);
            });
    }

    setVolume(volume) {
        this.audio.volume = Math.max(0, Math.min(1, volume));
    }

    destroy() {
        this.stop();
        this.audio.src = '';
    }
}

// ============================================================================
// GENERADOR DE RUTAS
// ============================================================================

function getAssetPath(theme, file) {
    const basePath = ISPRODUCTION
        ? 'https://raw.githubusercontent.com/santiagoinostroza/tetris-game/main/src/assets/sounds'
        : '/src/assets/sounds';
    
    return `${basePath}/${theme}/${file}`;
}

// ============================================================================
// ESTADO GLOBAL
// ============================================================================

let currentTheme = 'tetris';
const musicVolume = ref(DEFAULT_MUSIC_VOLUME);
const soundVolume = ref(DEFAULT_SOUND_VOLUME);

// ============================================================================
// GESTORES DE AUDIO
// ============================================================================

const audioManagers = {
    bgMusic: null,
    bonus: null,
    removeLineOne: null,
    removeLineTwo: null,
    removeLineThree: null,
    removeLineFour: null,
    removeLineFive: null,
    collision: null,
    move: null,
    rotate: null,
    speedDown: null,
};

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

/**
 * Selecciona y carga el tema de audio
 * @param {string} theme - ID del tema (tetris, db, sm)
 */
export function selectTheme(theme) {
    // Limpiar audio anterior
    Object.values(audioManagers).forEach(manager => {
        if (manager) manager.destroy();
    });

    currentTheme = theme;

    // Cargar nuevos audios
    audioManagers.bgMusic = new AudioManager(
        getAssetPath(theme, 'bg/1.mp3'),
        musicVolume.value,
        true
    );

    audioManagers.bonus = new AudioManager(
        getAssetPath(theme, 'bonusSound.mp3'),
        musicVolume.value,
        false
    );

    audioManagers.removeLineOne = new AudioManager(
        getAssetPath(theme, 'removeLineOne.mp3'),
        soundVolume.value
    );

    audioManagers.removeLineTwo = new AudioManager(
        getAssetPath(theme, 'removeLineTwo.mp3'),
        soundVolume.value
    );

    audioManagers.removeLineThree = new AudioManager(
        getAssetPath(theme, 'removeLineThree.mp3'),
        soundVolume.value
    );

    audioManagers.removeLineFour = new AudioManager(
        getAssetPath(theme, 'removeLineFour.mp3'),
        soundVolume.value
    );

    audioManagers.removeLineFive = new AudioManager(
        getAssetPath(theme, 'removeLineFive.mp3'),
        soundVolume.value
    );

    audioManagers.collision = new AudioManager(
        getAssetPath(theme, 'collisionSound.mp3'),
        soundVolume.value
    );

    audioManagers.move = new AudioManager(
        getAssetPath(theme, 'moveSound.mp3'),
        soundVolume.value
    );

    audioManagers.rotate = new AudioManager(
        getAssetPath(theme, 'rotateSound.mp3'),
        soundVolume.value
    );

    audioManagers.speedDown = new AudioManager(
        getAssetPath(theme, 'speedDownSound.mp3'),
        soundVolume.value
    );
}

// Inicializar con tema por defecto
selectTheme('tetris');

// ============================================================================
// CONTROL DE VOLUMEN
// ============================================================================

/**
 * Establece el volumen de la música
 * @param {number} volume - Volumen (0-1)
 */
export function setMusicVolume(volume) {
    musicVolume.value = volume;
    audioManagers.bgMusic?.setVolume(volume);
    audioManagers.bonus?.setVolume(volume);
}

/**
 * Establece el volumen de los efectos de sonido
 * @param {number} volume - Volumen (0-1)
 */
export function setSoundVolume(volume) {
    soundVolume.value = volume;
    
    Object.entries(audioManagers).forEach(([key, manager]) => {
        if (key !== 'bgMusic' && key !== 'bonus' && manager) {
            manager.setVolume(volume);
        }
    });
}

// ============================================================================
// MÚSICA DE FONDO
// ============================================================================

export function startGameAudio() {
    audioManagers.bgMusic?.play();
}

export function stopGameAudio() {
    audioManagers.bgMusic?.stop();
}

export function pauseGameAudio() {
    audioManagers.bgMusic?.pause();
}

export function resumeGameAudio() {
    audioManagers.bgMusic?.resume();
}

// ============================================================================
// SONIDO DE BONUS
// ============================================================================

export function startBonusSound() {
    audioManagers.bonus?.play();
}

export function stopBonusSound() {
    audioManagers.bonus?.stop();
}

export function pauseBonusSound() {
    audioManagers.bonus?.pause();
}

// ============================================================================
// EFECTOS DE SONIDO - LÍNEAS
// ============================================================================

export function startRemoveLineOneSound() {
    audioManagers.removeLineOne?.play();
}

export function startRemoveLineTwoSound() {
    audioManagers.removeLineTwo?.play();
}

export function startRemoveLineThreeSound() {
    audioManagers.removeLineThree?.play();
}

export function startRemoveLineFourSound() {
    audioManagers.removeLineFour?.play();
}

export function startRemoveLineFiveSound() {
    audioManagers.removeLineFive?.play();
}

// ============================================================================
// EFECTOS DE SONIDO - MOVIMIENTO
// ============================================================================

export function startCollisionSound() {
    audioManagers.collision?.play();
}

export function startMoveSound() {
    if (audioManagers.move) {
        audioManagers.move.play();
        
        // Detener después de 50ms para evitar saturación
        setTimeout(() => {
            audioManagers.move.stop();
        }, 50);
    }
}

export function startRotateSound() {
    if (audioManagers.rotate) {
        audioManagers.rotate.play();
        
        setTimeout(() => {
            audioManagers.rotate.stop();
        }, 50);
    }
}

export function startSpeedDownSound() {
    if (audioManagers.speedDown) {
        audioManagers.speedDown.audio.currentTime = 0.2;
        audioManagers.speedDown.play();
    }
}

// ============================================================================
// LIMPIEZA
// ============================================================================

/**
 * Limpia todos los recursos de audio
 */
export function cleanupAudio() {
    Object.values(audioManagers).forEach(manager => {
        if (manager) manager.destroy();
    });
}