<script setup>
import { defineEmits, computed, ref } from 'vue';
import { DIFFICULTY, difficulty, setDifficulty } from '/src/utils/config.js';
import { name, setName } from '/src/utils/player.js'; // ✅ NUEVO

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

const isEditingName = ref(false);
const tempName = ref(name || '');
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

function startEditName() {
    tempName.value = name || '';
    isEditingName.value = true;
}

function saveName() {
    if (tempName.value.trim()) {
        setName(tempName.value.trim());
        isEditingName.value = false;
    }
}

function cancelEdit() {
    isEditingName.value = false;
    tempName.value = name || '';
}

</script>

<template>
    <div class="config-container">
        <h1 class="shining game_name text-center">TETRIS</h1>
        
        <div>
            <div class="name-section">
                <h2 class="config-title">TU NOMBRE</h2>
                
                <div v-if="!isEditingName" class="name-display">
                    <p class="current-name">{{ name || 'Sin nombre' }}</p>
                    <button @click="startEditName" class="btn-edit-name">
                        CAMBIAR
                    </button>
                </div>
                
                <div v-else class="name-edit">
                    <input 
                        v-model="tempName"
                        @keyup.enter="saveName"
                        @keyup.esc="cancelEdit"
                        type="text"
                        placeholder="Tu nombre"
                        maxlength="20"
                        class="name-input-config"
                        autofocus
                    />
                    <div class="name-edit-buttons">
                        <button @click="saveName" class="btn-save">GUARDAR</button>
                        <button @click="cancelEdit" class="btn-cancel">CANCELAR</button>
                    </div>
                </div>
            </div>
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
    @apply w-screen flex flex-col justify-between;
    height: 100vh;
    height: 100dvh; /* ✅ Usar dvh para móviles */
    overflow-y: auto; /* ✅ Permitir scroll si es necesario */
    padding-bottom: env(safe-area-inset-bottom, 1rem); /* ✅ Respeta notch */
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
    padding-bottom: 2rem; /* ✅ Más padding abajo */
}

.menu-button {
    @apply text-xl md:text-2xl border rounded-2xl p-3 w-72 md:w-[35rem] bg-gradient-to-r from-green-600 to-green-800 font-extrabold hover:from-green-700 hover:to-green-900 transition-all;
    border-color: rgba(255, 255, 255, 0.8);
    box-shadow: 
      0 0 10px rgba(255, 255, 255, 0.3),
      inset 0 0 5px rgba(255, 255, 255, 0.2);
}


/* ============================================================================
   SECCIÓN DE NOMBRE
   ============================================================================ */
.name-section {
    @apply mb-8;
}

.name-display {
    @apply flex flex-col md:flex-row gap-4 items-center justify-center;
}

.current-name {
    @apply text-2xl font-bold text-green-400 px-6 py-3 rounded-xl;
    background: rgba(16, 185, 129, 0.2);
    border: 2px solid rgba(16, 185, 129, 0.5);
}

.btn-edit-name {
    @apply px-6 py-3 rounded-xl font-bold transition-all;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    border: 2px solid rgba(255, 255, 255, 0.5);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.btn-edit-name:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
}

.name-edit {
    @apply flex flex-col gap-4 items-center;
}

.name-input-config {
    @apply w-72 text-center text-xl font-bold p-3 rounded-xl;
    background: rgba(255, 255, 255, 0.95);
    color: #1e40af;
    border: 3px solid rgba(255, 255, 255, 0.5);
}

.name-input-config:focus {
    outline: none;
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.3);
}

.name-edit-buttons {
    @apply flex gap-4;
}

.btn-save {
    @apply px-6 py-2 rounded-xl font-bold;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border: 2px solid rgba(255, 255, 255, 0.5);
}

.btn-cancel {
    @apply px-6 py-2 rounded-xl font-bold;
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    border: 2px solid rgba(255, 255, 255, 0.5);
}

/* ============================================================================
   MOBILE FIXES
   ============================================================================ */
@media (max-width: 768px) {
    .config-container {
        padding: 1rem 0.5rem;
    }
    
    .difficulty-button {
        min-width: 150px;
        padding: 1rem;
    }
    
    .config-title {
        font-size: 1.5rem;
        padding: 1rem;
        margin-bottom: 0.5rem;
    }
}
</style>