import { ref, watch } from 'vue';
import {
    startGameAudio,
    stopGameAudio,
    pauseGameAudio,
    startBonusSound,
    stopBonusSound,
    pauseBonusSound,
    setMusicVolume,
    setSoundVolume
} from '/src/utils/sounds.js';

/**
 * Composable para manejar el audio del juego
 */
export function useGameAudio() {
    const isMusicOn = ref(true);
    const isSoundsOn = ref(true);
    
    let isGameSoundPlaying = false;
    let isBonusSoundPlaying = false;
    let pausedSound = null; // 'game' | 'bonus' | null

    /**
     * Inicia la música del juego
     */
    function startMusic() {
        startGameAudio();
        isGameSoundPlaying = true;
        pausedSound = null;
    }

    /**
     * Detiene la música del juego
     */
    function stopMusic() {
        stopGameAudio();
        isGameSoundPlaying = false;
    }

    /**
     * Pausa el audio activo
     */
    function pauseAudio() {
        if (isGameSoundPlaying) {
            pauseGameAudio();
            pausedSound = 'game';
            isGameSoundPlaying = false;
        }
        if (isBonusSoundPlaying) {
            pauseBonusSound();
            pausedSound = 'bonus';
            isBonusSoundPlaying = false;
        }
    }

    /**
     * Reanuda el audio pausado
     */
    function resumeAudio() {
        if (pausedSound === 'game') {
            startGameAudio();
            isGameSoundPlaying = true;
        }
        if (pausedSound === 'bonus') {
            startBonusSound();
            isBonusSoundPlaying = true;
        }
        pausedSound = null;
    }

    /**
     * Inicia el sonido de bonus
     */
    function playBonusSound() {
        pauseGameAudio();
        isGameSoundPlaying = false;
        startBonusSound();
        isBonusSoundPlaying = true;
    }

    /**
     * Detiene el sonido de bonus y vuelve a la música del juego
     */
    function stopBonusAndResumeGame() {
        stopBonusSound();
        isBonusSoundPlaying = false;
        startGameAudio();
        isGameSoundPlaying = true;
    }

    /**
     * Alterna música on/off
     */
    function toggleMusic(value) {
        if (value) {
            setMusicVolume(1);
        } else {
            setMusicVolume(0);
        }
    }

    /**
     * Alterna sonidos on/off
     */
    function toggleSounds(value) {
        if (value) {
            setSoundVolume(1);
        } else {
            setSoundVolume(0);
        }
    }

    // Watchers para cambios en configuración
    watch(isMusicOn, toggleMusic);
    watch(isSoundsOn, toggleSounds);

    return {
        isMusicOn,
        isSoundsOn,
        startMusic,
        stopMusic,
        pauseAudio,
        resumeAudio,
        playBonusSound,
        stopBonusAndResumeGame
    };
}