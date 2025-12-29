<script setup>
import { defineEmits, onMounted, ref, computed } from 'vue';
import { fetchPlayers } from '/src/api/apiPlayer.js';
import { ISMOBILE } from '/src/utils/consts.js';
import { difficulty } from '/src/utils/config.js';

// ============================================================================
// EMITS
// ============================================================================

const emit = defineEmits(['startGame', 'setConfig', 'scores']);

// ============================================================================
// ESTADO
// ============================================================================

const topPlayers = ref([]);
const isLoading = ref(true);

// ============================================================================
// COMPUTED
// ============================================================================

const containerHeight = computed(() => {
    return ISMOBILE ? 'calc(100vh - 50px)' : '100vh';
});

// ============================================================================
// MÉTODOS
// ============================================================================

/**
 * Carga el top 5 de jugadores para la dificultad actual
 */
async function loadTopPlayers() {
    isLoading.value = true;
    
    try {
        const response = await fetchPlayers(5, difficulty.value);
        topPlayers.value = response.data || [];
        
        // Mostrar mensaje si es desde caché
        if (response.fromCache) {
            console.log('📦 Mostrando puntajes locales (sin conexión)');
        }
    } catch (error) {
        console.error("Error al cargar los puntajes:", error);
        topPlayers.value = [];
    } finally {
        isLoading.value = false;
    }
}

/**
 * Formatea el país para mostrar
 */
function formatCountry(country) {
    if (!country) return '-';
    return country.length > 15 ? country.substring(0, 15) + '...' : country;
}

// ============================================================================
// EVENTOS
// ============================================================================

function startGame() {
    emit('startGame');
}

function setConfig() {
    emit('setConfig');
}

function scores() {
    emit('scores');
}

// ============================================================================
// LIFECYCLE
// ============================================================================

onMounted(() => {
    loadTopPlayers();
});
</script>

<template>
    <div 
        class="menu-container" 
        :style="{ height: containerHeight }"
    >
        <!-- Header -->
        <article class="menu-header">
            <h1 class="shining game_name text-center">TETRIS</h1>
            
            <!-- Top 5 Table -->
            <article class="top-players-section">
                <h2 class="moving-text top-title">Top 5</h2>
                
                <div class="top-players-container">
                    <!-- Loading State -->
                    <div v-if="isLoading" class="loading-container">
                        <div class="spinner"></div>
                        <p class="text-sm">Cargando...</p>
                    </div>
                    
                    <!-- Empty State -->
                    <div v-else-if="topPlayers.length === 0" class="empty-container">
                        <p class="text-sm">No hay puntajes aún</p>
                        <p class="text-xs opacity-75 mt-1">¡Sé el primero!</p>
                    </div>
                    
                    <!-- Players Table -->
                    <table v-else class="players-table">
                        <thead>
                            <tr>
                                <th class="table-header">Pos.</th>
                                <th class="table-header w-full">Nombre</th>
                                <th class="table-header w-32 hidden md:table-cell">Fecha</th>
                                <th class="table-header w-24">País</th>
                                <th class="table-header text-right">Puntaje</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr 
                                v-for="(player, index) in topPlayers" 
                                :key="player.id"
                                class="table-row"
                            >
                                <td class="table-cell">
                                    <span class="position-badge" :class="`position-${index + 1}`">
                                        {{ index + 1 }}
                                    </span>
                                </td>
                                <td class="table-cell truncate">{{ player.name }}</td>
                                <td class="table-cell hidden md:table-cell">{{ player.date }}</td>
                                <td class="table-cell" :title="player.country">
                                    {{ formatCountry(player.country) }}
                                </td>
                                <td class="table-cell text-right font-bold">
                                    {{ player.score?.toLocaleString() }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </article>
        </article>

        <!-- Menu Buttons -->
        <article class="menu-buttons">
            <button 
                @click="startGame" 
                class="btn-primary"
            >
                JUGAR
            </button>
            
            <div class="btn-secondary-group">
                <button 
                    @click="setConfig" 
                    class="btn-secondary"
                >
                    CONFIGURACIÓN
                </button>
                <button 
                    @click="scores" 
                    class="btn-secondary"
                >
                    PUNTAJES
                </button>
            </div>
        </article>
    </div>
</template>

<style scoped>
/* ============================================================================
   LAYOUT PRINCIPAL
   ============================================================================ */
.menu-container {
    @apply flex flex-col gap-12 md:gap-8 justify-between items-center pb-28 md:pb-14;
}

.menu-header {
    @apply flex flex-col gap-8 md:gap-2 w-full;
}

/* ============================================================================
   TOP PLAYERS
   ============================================================================ */
.top-players-section {
    @apply grid justify-center;
}

.top-title {
    @apply w-max p-4 text-3xl font-extrabold mx-auto;
}

.top-players-container {
    @apply shadow border p-4 rounded-xl w-72 md:w-[35rem] text-sm bg-gradient-to-r from-blue-600 to-blue-800 min-h-[250px] flex items-center justify-center;
    /* border-shine aplicado manualmente */
    border-color: rgba(255, 255, 255, 0.8);
    box-shadow: 
      0 0 10px rgba(255, 255, 255, 0.3),
      inset 0 0 5px rgba(255, 255, 255, 0.2);
}

/* ============================================================================
   ESTADOS
   ============================================================================ */
.loading-container,
.empty-container {
    @apply flex flex-col items-center justify-center gap-2 text-white/80;
}

.spinner {
    @apply w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin;
}

/* ============================================================================
   TABLA
   ============================================================================ */
.players-table {
    @apply text-left w-full;
}

.table-header {
    @apply p-2 py-1 font-bold text-white;
}

.table-row {
    @apply border-t border-white/20 hover:bg-white/10 transition-colors;
}

.table-cell {
    @apply p-2 py-1 text-white;
}

.position-badge {
    @apply inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs;
}

.position-1 {
    @apply bg-yellow-400 text-yellow-900;
}

.position-2 {
    @apply bg-gray-300 text-gray-900;
}

.position-3 {
    @apply bg-orange-400 text-orange-900;
}

/* ============================================================================
   BOTONES
   ============================================================================ */
.menu-buttons {
    @apply flex gap-4 flex-col items-center justify-center;
}

.btn-primary {
    @apply text-xl md:text-2xl border rounded-2xl p-3 w-72 md:w-[35rem] bg-gradient-to-r from-green-600 to-green-800 font-extrabold hover:from-green-700 hover:to-green-900 transition-all;
    /* border-shine aplicado manualmente */
    border-color: rgba(255, 255, 255, 0.8);
    box-shadow: 
      0 0 10px rgba(255, 255, 255, 0.3),
      inset 0 0 5px rgba(255, 255, 255, 0.2);
}

.btn-secondary-group {
    @apply flex gap-4 flex-col md:flex-row;
}

.btn-secondary {
    @apply text-xl md:text-2xl border rounded-2xl p-3 w-72 md:w-[17rem] bg-gradient-to-r from-blue-600 to-blue-800 font-extrabold hover:from-blue-700 hover:to-blue-900 transition-all;
    /* border-shine aplicado manualmente */
    border-color: rgba(255, 255, 255, 0.8);
    box-shadow: 
      0 0 10px rgba(255, 255, 255, 0.3),
      inset 0 0 5px rgba(255, 255, 255, 0.2);
}
</style>