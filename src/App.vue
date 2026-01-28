<script setup>
import { ref, onMounted } from 'vue';
import MenuScreen from './components/MenuScreen.vue';
import ConfigScreen from './components/ConfigScreen.vue';
import GameScreen from './components/GameScreen.vue';
import ScoreScreen from './components/ScoreScreen.vue';
import { setName, hasPlayerName } from './utils/player.js';

const currentScreen = ref('menu');
const showNameModal = ref(false);
const tempName = ref('');

onMounted(() => {
    // ✅ Verificar si el usuario tiene nombre
    if (!hasPlayerName()) {
        showNameModal.value = true;
    }
});

function startGame() {
    currentScreen.value = 'game';
}

function setConfig() {
    currentScreen.value = 'config';
}

function menu() {
    currentScreen.value = 'menu';
}

function scores() {
    currentScreen.value = 'scores';
}

function gameOver() {
    currentScreen.value = 'menu';
}

// ✅ NUEVO: Guardar nombre
function saveName() {
    if (tempName.value.trim()) {
        setName(tempName.value.trim());
        showNameModal.value = false;
    }
}
</script>

<template>
    <div class="app-container">
        <MenuScreen 
            v-if="currentScreen === 'menu'"
            @start-game="startGame"
            @set-config="setConfig"
            @scores="scores"
        />
        
        <ConfigScreen 
            v-if="currentScreen === 'config'"
            @menu="menu"
        />
        
        <GameScreen 
            v-if="currentScreen === 'game'"
            @menu="menu"
            @game-over="gameOver"
        />
        
        <ScoreScreen 
            v-if="currentScreen === 'scores'"
            @menu="menu"
        />

        <!-- ✅ NUEVO: Modal para pedir nombre -->
        <div v-if="showNameModal" class="modal-overlay-name">
            <div class="modal-container-name">
                <div class="modal-content-name">
                    <h2 class="modal-title-name">¡Bienvenido a Tetris!</h2>
                    <p class="modal-subtitle-name">¿Cómo te llamas?</p>
                    
                    <input 
                        v-model="tempName"
                        @keyup.enter="saveName"
                        type="text"
                        placeholder="Tu nombre"
                        maxlength="20"
                        class="name-input-modal"
                        autofocus
                    />
                    
                    <button 
                        @click="saveName"
                        :disabled="!tempName.trim()"
                        class="btn-save-name"
                        :class="{ 'opacity-50': !tempName.trim() }"
                    >
                        COMENZAR
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* ============================================================================
   FONDO DE PANTALLA
   ============================================================================ */
.app-container {
    @apply min-h-screen w-full;
     background-image: url('/bg4.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-attachment: fixed;
}

/* ============================================================================
   MODAL DE NOMBRE
   ============================================================================ */
.modal-overlay-name {
    @apply fixed inset-0 bg-black/80 z-50 flex items-center justify-center;
    backdrop-filter: blur(5px);
}

.modal-container-name {
    @apply w-full max-w-md mx-4;
}

.modal-content-name {
    @apply bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-2xl border-2;
    border-color: rgba(255, 255, 255, 0.8);
    box-shadow: 
      0 0 20px rgba(255, 255, 255, 0.3),
      inset 0 0 10px rgba(255, 255, 255, 0.1);
}

.modal-title-name {
    @apply text-3xl font-extrabold text-center mb-2 text-white;
}

.modal-subtitle-name {
    @apply text-lg text-center mb-6 text-white/80;
}

.name-input-modal {
    @apply w-full text-center text-2xl font-bold p-4 rounded-xl mb-6;
    background: rgba(255, 255, 255, 0.95);
    color: #1e40af;
    border: 3px solid rgba(255, 255, 255, 0.5);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.name-input-modal:focus {
    outline: none;
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.3);
}

.btn-save-name {
    @apply w-full text-2xl font-extrabold p-4 rounded-xl;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border: 3px solid rgba(255, 255, 255, 0.5);
    color: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    transition: all 0.2s;
}

.btn-save-name:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.btn-save-name:active:not(:disabled) {
    transform: translateY(0);
}

.btn-save-name:disabled {
    cursor: not-allowed;
}
</style>