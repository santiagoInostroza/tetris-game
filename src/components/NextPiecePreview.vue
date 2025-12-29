<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { drawSquare } from '/src/utils/draw.js';
import { PIECES_IMAGES } from '/src/utils/images.js';

// ============================================================================
// PROPS
// ============================================================================

const props = defineProps({
    nextPiece: {
        type: Object,
        required: true
    }
});

// ============================================================================
// REFS
// ============================================================================

const canvas = ref(null);
const context = ref(null);

// ============================================================================
// COMPUTED
// ============================================================================

const previewSize = computed(() => {
    if (!props.nextPiece?.matrix || !Array.isArray(props.nextPiece.matrix) || props.nextPiece.matrix.length === 0) {
        return { width: 4, height: 4 };
    }
    
    const matrix = props.nextPiece.matrix;
    return {
        width: Math.max(matrix[0]?.length || 4, 4),
        height: Math.max(matrix.length, 4)
    };
});

const blockSize = 20; // Tamaño de cada bloque en píxeles

// ============================================================================
// MÉTODOS
// ============================================================================

function initializeCanvas() {
    if (!canvas.value) return;
    
    const size = previewSize.value;
    canvas.value.width = size.width * blockSize;
    canvas.value.height = size.height * blockSize;
    
    context.value = canvas.value.getContext('2d');
    context.value.scale(blockSize, blockSize);
    
    drawPreview();
}


function drawPreview() {
    // ✅ Validaciones completas
    if (!context.value) {
        console.warn('NextPiecePreview: context no disponible');
        return;
    }
    
    if (!props.nextPiece?.matrix || !Array.isArray(props.nextPiece.matrix) || props.nextPiece.matrix.length === 0) {
        // Dibujar canvas vacío
        const size = previewSize.value;
        context.value.fillStyle = 'black';
        context.value.fillRect(0, 0, size.width, size.height);
        return;
    }
    
    const size = previewSize.value;
    const matrix = props.nextPiece.matrix;
    
    // Validar primera fila
    if (!matrix[0] || !Array.isArray(matrix[0])) {
        console.warn('NextPiecePreview: matriz inválida');
        return;
    }
    
    // Limpiar canvas
    context.value.fillStyle = 'black';
    context.value.fillRect(0, 0, size.width, size.height);
    
    // Calcular offset para centrar la pieza
    const offsetX = (size.width - matrix[0].length) / 2;
    const offsetY = (size.height - matrix.length) / 2;
    
    // Dibujar la pieza
    matrix.forEach((row, y) => {
        if (!Array.isArray(row)) return;
        
        row.forEach((value, x) => {
            if (value > 0) {
                drawSquare(
                    context.value,
                    offsetX + x,
                    offsetY + y,
                    props.nextPiece.color || 'white',
                    props.nextPiece.color || 'white',
                    0.06,
                    'black',
                    false,
                    PIECES_IMAGES
                );
            }
        });
    });
}

// ============================================================================
// LIFECYCLE
// ============================================================================

onMounted(() => {
    initializeCanvas();
});

watch(() => props.nextPiece.matrix, () => {
    if (context.value) {
        drawPreview();
    }
}, { deep: true });
</script>

<template>
    <div class="next-piece-container">
        <div class="next-piece-canvas-wrapper">
            <canvas ref="canvas" class="next-piece-canvas"></canvas>
        </div>
    </div>
</template>

<style scoped>
.next-piece-container {
    @apply flex flex-col gap-2;
}

.next-piece-title {
    @apply text-center font-bold text-xl uppercase;
}

.next-piece-canvas-wrapper {
    @apply p-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center;
    border: 4px solid rgba(255, 255, 255, 0.8);
    box-shadow: 
      0 0 10px rgba(255, 255, 255, 0.3),
      inset 0 0 5px rgba(255, 255, 255, 0.2);
}

.next-piece-canvas {
    @apply rounded border-2 border-white/20;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
}
</style>