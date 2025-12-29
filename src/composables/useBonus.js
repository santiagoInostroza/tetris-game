import { ref } from 'vue';
import {
    startRemoveLineOneSound,
    startRemoveLineTwoSound,
    startRemoveLineThreeSound,
    startRemoveLineFourSound,
    startRemoveLineFiveSound
} from '/src/utils/sounds.js';

/**
 * Configuración de probabilidades de bonus
 * Cada celda tiene una probabilidad de tener un multiplicador
 */
const BONUS_CHANCES = [
    { multiplier: 2, threshold: 3.5 },   // 3.5% chance
    { multiplier: 3, threshold: 5.5 },   // 2.0% chance adicional (5.5 - 3.5)
    { multiplier: 4, threshold: 7.0 },   // 1.5% chance adicional (7.0 - 5.5)
    { multiplier: 5, threshold: 8.0 },   // 1.0% chance adicional (8.0 - 7.0)
    { multiplier: 10, threshold: 8.2 },  // 0.2% chance adicional (8.2 - 8.0)
];


/**
 * Composable para manejar el sistema de bonus
 */
export function useBonus() {
    // Estado del bonus visual
    const showBonus = ref(false);
    const textBonus = ref('');
    const timeBonus = ref(0);
    const remainingBonusTime = ref(0);
    
    // Estado del bonus en líneas
    const showScoreOnLine = ref(false);
    const linePosition = ref(-10);
    const newScore = ref(0);
    
    // Multiplicador actual
    let currentMultiplier = 1;
    
    // Filas que ya tienen bonus asignado
    let rowsWithBonus = [];
    
    // Contador de bonus acumulados
    let bonusCount = 0;
    
    // Contador de timeouts activos
    let activeBonusTimeouts = 0;

    /**
     * Calcula el bonus para una celda
     * @returns {number} Multiplicador (0, 2, 3, 4, 5, o 10)
     */
    function calculateBonus() {
        const random = Math.random() * 100;
        
        console.log('🎲 Random:', random.toFixed(2));
        
        // ✅ CORRECCIÓN: Iterar normalmente desde i=0 hacia arriba
        for (let i = 0; i < BONUS_CHANCES.length; i++) {
            const { multiplier, threshold } = BONUS_CHANCES[i];
            if (random < threshold) {
                console.log('✅ Bonus asignado:', multiplier, 'threshold:', threshold);
                return multiplier;
            }
        }
        
        console.log('❌ Sin bonus');
        return 0;
    }

    /**
     * Asigna bonus a una celda si la fila no tiene bonus aún
     * @param {number} rowIndex - Índice de la fila
     * @returns {number} Multiplicador asignado
     */
    function assignBonus(rowIndex) {
        if (rowsWithBonus.includes(rowIndex)) {
            return 0;
        }
        
        const bonus = calculateBonus();
        
        if (bonus > 0) {
            rowsWithBonus.push(rowIndex);
        }
        
        return bonus;
    }

    /**
     * Obtiene el multiplicador actual
     */
    function getMultiplier() {
        return currentMultiplier;
    }

    /**
     * Inicia animación de bonus en pantalla
     * @param {number} duration - Duración en segundos
     * @param {string} text - Texto a mostrar (ej: "X3")
     * @param {number} multiplier - Multiplicador
     */
    function startBonusAnimation(duration, text, multiplier, onComplete) {
        activeBonusTimeouts++;
        
        textBonus.value = text;
        currentMultiplier = multiplier;
        showBonus.value = true;
        timeBonus.value = remainingBonusTime.value = duration * 1000;
        
        setTimeout(() => {
            activeBonusTimeouts--;
            
            if (activeBonusTimeouts === 0) {
                showBonus.value = false;
                textBonus.value = '';
                currentMultiplier = 1;
                bonusCount = 0;
                onComplete?.();
            }
        }, duration * 1000);
    }

   /**
     * Procesa líneas completadas y calcula bonus
     * @param {Array} board - Tablero de juego
     * @param {Function} onLineRemoved - Callback al remover cada línea
     * @returns {Object} Información sobre líneas y bonus
     */
    function processCompletedLines(board, onLineRemoved) {
        const linePositions = [];
        let totalBonus = 0;
        let bonusLineCount = 0;

        // Identificar líneas completas y contar bonus
        board.forEach((row, y) => {
            if (row.every((cell) => cell.value > 0)) {
                linePositions.push(y);
                
                // Remover de rowsWithBonus
                rowsWithBonus = rowsWithBonus.filter((r) => r !== y);
                
                // Contar bonus en esta línea
                if (row.some((cell) => cell.bonus > 0)) {
                    row.forEach((cell) => {
                        if (cell.bonus > 0) {
                            totalBonus += cell.bonus; // ⚠️ ESTO suma los multiplicadores
                            bonusLineCount++;
                        }
                    });
                }
            }
        });

        bonusCount = totalBonus;
        
        return {
            linePositions,
            totalBonus,      // Suma de todos los multiplicadores
            bonusLineCount,  // Cantidad de celdas con bonus
            lineCount: linePositions.length
        };
    }

    /**
     * Remueve una línea específica del tablero
     * @param {Array} board - Tablero de juego
     * @param {number} y - Posición Y de la línea
     */
    function removeLine(board, y) {
        board.splice(y, 1);
        const newRow = Array.from({ length: board[0].length }, () => ({ 
            value: 0, 
            color: null, 
            bonus: 0 
        }));
        board.unshift(newRow);
    }

    /**
     * Reproduce el sonido correspondiente al número de línea
     * @param {number} lineIndex - Índice de la línea (0-4)
     */
    function playLineSound(lineIndex) {
        const sounds = [
            startRemoveLineOneSound,
            startRemoveLineTwoSound,
            startRemoveLineThreeSound,
            startRemoveLineFourSound,
            startRemoveLineFiveSound
        ];
        
        if (lineIndex < sounds.length) {
            sounds[lineIndex]();
        }
    }

    /**
     * Muestra el score en la línea completada
     * @param {number} y - Posición Y de la línea
     * @param {number} score - Score a mostrar
     */
    function showLineScore(y, score) {
        linePosition.value = y;
        newScore.value = score;
        showScoreOnLine.value = true;
    }

    /**
     * Oculta el score de línea
     */
    function hideLineScore() {
        showScoreOnLine.value = false;
        linePosition.value = -10;
    }

    /**
     * Resetea el sistema de bonus
     */
    function resetBonus() {
        rowsWithBonus = [];
        bonusCount = 0;
        currentMultiplier = 1;
        activeBonusTimeouts = 0;
        showBonus.value = false;
        showScoreOnLine.value = false;
        textBonus.value = '';
        linePosition.value = -10;
    }

    /**
     * Obtiene el contador de bonus acumulados
     */
    function getBonusCount() {
        return bonusCount;
    }

    return {
        // Estado reactivo
        showBonus,
        textBonus,
        timeBonus,
        remainingBonusTime,
        showScoreOnLine,
        linePosition,
        newScore,
        
        // Métodos
        calculateBonus,
        assignBonus,
        getMultiplier,
        startBonusAnimation,
        processCompletedLines,
        removeLine,
        playLineSound,
        showLineScore,
        hideLineScore,
        resetBonus,
        getBonusCount
    };
}