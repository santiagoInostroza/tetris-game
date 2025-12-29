<script setup>
import { defineEmits, onMounted, ref, computed } from 'vue';
import { fetchPlayers } from '/src/api/apiPlayer.js';
import { DIFFICULTY } from '/src/utils/config.js';

// ============================================================================
// EMITS
// ============================================================================

const emit = defineEmits(['menu']);

const menu = () => {
    emit('menu');
};

// ============================================================================
// ESTADO
// ============================================================================

const players = ref({
    [DIFFICULTY.EASY]: [],
    [DIFFICULTY.MEDIUM]: [],
    [DIFFICULTY.HARD]: [],
});

const isLoading = ref(true);
const error = ref(null);

// ============================================================================
// CONFIGURACIÓN DE DIFICULTADES
// ============================================================================

const difficulties = [
    { 
        key: DIFFICULTY.HARD, 
        label: 'DIFÍCIL',
        gradient: 'from-red-600 to-red-800'
    },
    { 
        key: DIFFICULTY.MEDIUM, 
        label: 'MODERADO',
        gradient: 'from-orange-600 to-orange-800'
    },
    { 
        key: DIFFICULTY.EASY, 
        label: 'FÁCIL',
        gradient: 'from-green-600 to-green-800'
    },
];

// ============================================================================
// COMPUTED
// ============================================================================

const hasPlayers = computed(() => {
    return Object.values(players.value).some(list => list.length > 0);
});

// ============================================================================
// MÉTODOS
// ============================================================================

/**
 * Carga los puntajes para todas las dificultades
 */
async function loadAllScores() {
    isLoading.value = true;
    error.value = null;

    try {
        const promises = Object.values(DIFFICULTY).map(async (difficulty) => {
            const response = await fetchPlayers(10, difficulty);
            return { difficulty, data: response.data };
        });

        const results = await Promise.all(promises);
        
        results.forEach(({ difficulty, data }) => {
            players.value[difficulty] = data;
        });
    } catch (err) {
        console.error("Error al cargar los puntajes:", err);
        error.value = "No se pudieron cargar los puntajes. Intenta nuevamente.";
    } finally {
        isLoading.value = false;
    }
}

/**
 * Formatea la fecha para mostrar
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch {
        return dateString;
    }
}

// ============================================================================
// LIFECYCLE
// ============================================================================

onMounted(() => {
    loadAllScores();
});
</script>

<template>
    <div class="scores-container">
        <h1 class="scores-title">PUNTAJES</h1>

        <!-- Loading State -->
        <div v-if="isLoading" class="scores-content">
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Cargando puntajes...</p>
            </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="scores-content">
            <div class="error-state">
                <p>{{ error }}</p>
                <button @click="loadAllScores" class="retry-button">
                    Reintentar
                </button>
            </div>
        </div>

        <!-- Scores Content -->
        <section v-else class="scores-content">
            <!-- Empty State -->
            <div v-if="!hasPlayers" class="empty-state">
                <p>No hay puntajes registrados aún.</p>
                <p class="text-sm mt-2">¡Sé el primero en jugar!</p>
            </div>

            <!-- Scores Tables -->
            <article 
                v-for="diff in difficulties" 
                :key="diff.key" 
                class="score-section"
            >
                <h2 class="difficulty-title">{{ diff.label }}</h2>
                
                <div 
                    class="score-table-container"
                    :class="`bg-gradient-to-r ${diff.gradient}`"
                >
                    <table v-if="players[diff.key]?.length > 0" class="score-table">
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
                                v-for="(player, index) in players[diff.key]" 
                                :key="player.id"
                                class="table-row"
                            >
                                <td class="table-cell">{{ index + 1 }}</td>
                                <td class="table-cell truncate">{{ player.name }}</td>
                                <td class="table-cell hidden md:table-cell">
                                    {{ formatDate(player.date) }}
                                </td>
                                <td class="table-cell">{{ player.country }}</td>
                                <td class="table-cell text-right font-bold">
                                    {{ player.score?.toLocaleString() }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div v-else class="empty-difficulty">
                        <p class="text-sm opacity-75">Sin puntajes en esta dificultad</p>
                    </div>
                </div>
            </article>
        </section>

        <!-- Botón Menu -->
        <section class="menu-button-container">
            <button 
                @click="menu" 
                class="menu-button"
            >
                MENÚ
            </button>
        </section>
    </div>
</template>

<style scoped>
/* ============================================================================
   LAYOUT PRINCIPAL
   ============================================================================ */
.scores-container {
    @apply flex flex-col gap-12 md:gap-8 justify-between items-center h-screen pb-28 md:pb-14;
}

.scores-title {
    @apply text-center text-5xl font-bold mt-8;
}

.scores-content {
    @apply flex flex-col gap-8 md:gap-4 overflow-auto border shadow-xl p-4 rounded-xl w-full max-w-4xl;
    height: calc(100% - 12rem);
}

/* ============================================================================
   ESTADOS (Loading, Error, Empty)
   ============================================================================ */
.loading-state,
.error-state,
.empty-state {
    @apply flex flex-col items-center justify-center h-full gap-4 text-gray-300;
}

.spinner {
    @apply w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin;
}

.retry-button {
    @apply px-6 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 font-bold hover:from-blue-700 hover:to-blue-900 transition-all;
    /* border-shine aplicado manualmente */
    border: 2px solid rgba(255, 255, 255, 0.8);
    box-shadow: 
      0 0 10px rgba(255, 255, 255, 0.3),
      inset 0 0 5px rgba(255, 255, 255, 0.2);
}

/* ============================================================================
   SECCIÓN DE SCORES
   ============================================================================ */
.score-section {
    @apply grid justify-center;
}

.difficulty-title {
    @apply w-max p-4 text-3xl font-extrabold;
}

.score-table-container {
    @apply shadow border p-4 rounded-xl w-72 md:w-[35rem] text-sm;
    /* border-shine aplicado manualmente */
    border-color: rgba(255, 255, 255, 0.8);
    box-shadow: 
      0 0 10px rgba(255, 255, 255, 0.3),
      inset 0 0 5px rgba(255, 255, 255, 0.2);
}

/* ============================================================================
   TABLA
   ============================================================================ */
.score-table {
    @apply text-left w-full;
}

.table-header {
    @apply p-2 py-1 font-bold;
}

.table-row {
    @apply border-t border-white/20 hover:bg-white/10 transition-colors;
}

.table-cell {
    @apply p-2 py-1;
}

.empty-difficulty {
    @apply text-center py-8;
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