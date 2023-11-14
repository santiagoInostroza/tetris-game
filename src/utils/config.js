import { ref } from 'vue';

export const DIFFICULTY = {
    EASY: 'EASY',
    MEDIUM: 'MEDIUM',
    HARD: 'HARD',
};

// Usando ref para hacerlo reactivo
export const difficulty = ref(DIFFICULTY.MEDIUM);

export const setDifficulty = (newDifficulty) => {
    difficulty.value = newDifficulty; // Actualizar el valor reactivo
};
