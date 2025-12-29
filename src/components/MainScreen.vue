<script setup>
import { defineEmits } from 'vue';

// ============================================================================
// EMITS
// ============================================================================

const emit = defineEmits(['setTheme']);

// ============================================================================
// CONFIGURACIÓN DE TEMAS
// ============================================================================

const themes = [
    {
        id: 'tetris',
        name: 'Tetris Clásico',
        logo: '/src/assets/img/logo_tetris.png',
        description: 'Tema original del juego'
    },
    {
        id: 'db',
        name: 'Dragon Ball',
        logo: '/src/assets/img/logo_db.png',
        description: 'Tema inspirado en Dragon Ball'
    },
    {
        id: 'sm',
        name: 'Sailor Moon',
        logo: '/src/assets/img/logo_sm.png',
        description: 'Tema inspirado en Sailor Moon'
    },
];

// ============================================================================
// MÉTODOS
// ============================================================================

function selectTheme(themeId) {
    emit('setTheme', themeId);
}
</script>

<template>
    <div class="theme-container">
        <h1 class="shining game_name text-center">TETRIS</h1>
        
        <div>
            <h2 class="theme-title">Selecciona Tu Tema Favorito</h2>
            
            <article class="theme-selector">
                <button
                    v-for="theme in themes"
                    :key="theme.id"
                    @click="selectTheme(theme.id)"
                    class="theme-button"
                    :aria-label="`Seleccionar tema ${theme.name}`"
                >
                    <div class="theme-image-container">
                        <img 
                            :src="theme.logo" 
                            :alt="`Logo ${theme.name}`" 
                            class="theme-image"
                        />
                    </div>
                    <div class="theme-info">
                        <h3 class="theme-name">{{ theme.name }}</h3>
                        <p class="theme-description">{{ theme.description }}</p>
                    </div>
                </button>
            </article>
        </div>
    </div>
</template>

<style scoped>
/* ============================================================================
   LAYOUT
   ============================================================================ */
.theme-container {
    @apply h-screen flex flex-col justify-between pb-8;
}

.theme-title {
    @apply font-bold text-3xl text-gray-300 text-center mb-4 p-4;
}

/* ============================================================================
   SELECTOR DE TEMAS
   ============================================================================ */
.theme-selector {
    @apply flex gap-6 justify-center items-center p-4 flex-wrap;
}

.theme-button {
    @apply backdrop-blur rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer;
    /* border-shine aplicado manualmente */
    border: 2px solid rgba(255, 255, 255, 0.8);
    box-shadow: 
      0 0 10px rgba(255, 255, 255, 0.3),
      inset 0 0 5px rgba(255, 255, 255, 0.2);
}

.theme-image-container {
    @apply w-[17rem] h-48 border-b border-white/20 bg-white/5 flex items-center justify-center p-4;
}

.theme-image {
    @apply w-full h-full object-contain;
}

.theme-info {
    @apply p-4 text-center bg-gradient-to-b from-blue-600/50 to-blue-800/50;
}

.theme-name {
    @apply text-xl font-bold mb-1;
}

.theme-description {
    @apply text-sm opacity-80;
}
</style>