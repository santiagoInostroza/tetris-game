<script setup>
import { defineEmits, computed } from 'vue';
import { DIFFICULTY, difficulty, setDifficulty } from '/src/utils/config.js';

// ============================================================================
// EMITS
// ============================================================================

const emit = defineEmits(['menu']);

// ============================================================================
// CONFIGURACIÓN DE DIFICULTADES
// ============================================================================

const difficulties = [
    {
        value: DIFFICULTY.EASY,
        label: 'FÁCIL',
        description: 'Piezas básicas y velocidad moderada',
        color: 'from-green-600 to-green-800',
        icon: '😊'
    },
    {
        value: DIFFICULTY.MEDIUM,
        label: 'MODERADO',
        description: 'Más variedad de piezas',
        color: 'from-orange-600 to-orange-800',
        icon: '🤔'
    },
    {
        value: DIFFICULTY.HARD,
        label: 'DIFÍCIL',
        description: 'Piezas complejas y desafiantes',
        color: 'from-red-600 to-red-800',
        icon: '😰'
    },
];

// ============================================================================
// COMPUTED
// ============================================================================

const currentDifficulty = computed(() => difficulty.value);

// ============================================================================
// MÉTODOS
// ============================================================================

function selectDifficulty(value) {
    setDifficulty(value);
}

function menu() {
    emit('menu');
}

function isSelected(value) {
    return currentDifficulty.value === value;
}
</script>

<template>
    <div class="config-container">
        <h1 class="shining game_name text-center">TETRIS</h1>
        
        <div>
            <h2 class="config-title">DIFICULTAD</h2>
            
            <article class="difficulty-selector">
                <button
                    v-for="diff in difficulties"
                    :key="diff.value"
                    @click="selectDifficulty(diff.value)"
                    class="difficulty-button"
                    :class="[
                        isSelected(diff.value) ? 'selected' : 'not-selected',
                        `bg-gradient-to-r ${diff.color}`
                    ]"
                >
                    <span class="difficulty-icon">{{ diff.icon }}</span>
                    <span class="difficulty-label">{{ diff.label }}</span>
                    <span class="difficulty-description">{{ diff.description }}</span>
                </button>
            </article>
        </div>
        
        <article class="menu-button-container">
            <button 
                @click="menu" 
                class="menu-button"
            >
                MENÚ
            </button>
        </article>
    </div>
</template>

<style scoped>
/* ============================================================================
   LAYOUT
   ============================================================================ */
.config-container {
    @apply h-screen flex flex-col justify-between pb-8;
}

.config-title {
    @apply font-bold text-3xl text-gray-300 text-center mb-4 p-4;
}

/* ============================================================================
   SELECTOR DE DIFICULTAD
   ============================================================================ */
.difficulty-selector {
    @apply flex gap-4 justify-center items-stretch p-4 flex-wrap;
}

.difficulty-button {
    @apply backdrop-blur rounded-xl p-6 min-w-[200px] flex flex-col gap-2 items-center text-center transition-all duration-300 cursor-pointer;
    /* border-shine aplicado manualmente */
    border: 2px solid rgba(255, 255, 255, 0.8);
    box-shadow: 
      0 0 10px rgba(255, 255, 255, 0.3),
      inset 0 0 5px rgba(255, 255, 255, 0.2);
}

.difficulty-button:hover {
    @apply transform scale-105 shadow-2xl;
}

.not-selected {
    @apply opacity-70;
}

.selected {
    @apply opacity-100 shadow-2xl ring-4 ring-white/50;
}

.difficulty-icon {
    @apply text-4xl;
}

.difficulty-label {
    @apply text-xl font-bold;
}

.difficulty-description {
    @apply text-sm opacity-90;
}

/* ============================================================================
   BOTÓN MENÚ
   ============================================================================ */
.menu-button-container {
    @apply flex gap-4 flex-col items-center justify-center;
}

.menu-button {
    @apply text-xl md:text-2xl border rounded-2xl p-3 w-72 md:w-[35rem] bg-gradient-to-r from-green-600 to-green-800 font-extrabold hover:from-green-700 hover:to-green-900 transition-all;
    /* border-shine aplicado manualmente */
    border-color: rgba(255, 255, 255, 0.8);
    box-shadow: 
      0 0 10px rgba(255, 255, 255, 0.3),
      inset 0 0 5px rgba(255, 255, 255, 0.2);
}
</style>