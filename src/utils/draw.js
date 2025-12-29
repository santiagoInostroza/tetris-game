// ============================================================================
// GENERADOR DE COLORES ALEATORIOS
// ============================================================================

const BONUS_COLORS = [
    'red',
    'blue',
    'green',
    'yellow',
    'purple',
    'orange',
    'cyan',
];

/**
 * Obtiene un color aleatorio del array de colores
 * @returns {string} Color en formato CSS
 */
function getRandomColor() {
    return BONUS_COLORS[Math.floor(Math.random() * BONUS_COLORS.length)];
}

// ============================================================================
// DIBUJO DE CUADRADOS
// ============================================================================

/**
 * Dibuja un cuadrado en el canvas
 * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
 * @param {number} x - Posición X
 * @param {number} y - Posición Y
 * @param {string} color - Color principal
 * @param {string} color2 - Color secundario para gradiente
 * @param {number} borderWidth - Ancho del borde
 * @param {string} borderColor - Color del borde
 * @param {boolean} isBonus - Si es una pieza con bonus
 * @param {Object} imgs - Objeto con imágenes de piezas especiales
 */
export function drawSquare(
    ctx,
    x,
    y,
    color,
    color2 = 'white',
    borderWidth = 0.08,
    borderColor = 'black',
    isBonus = false,
    imgs = null
) {
    const size = 1;

    // Determinar imagen especial
    const specialImage = getSpecialImage(color);
    
    // Ajustar colores si es imagen especial
    if (specialImage) {
        color = color2 = 'black';
    }

    // Color aleatorio si tiene bonus
    if (isBonus) {
        color = getRandomColor();
    }

    // Crear gradiente
    const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, color2);

    // Dibujar cuadrado con sombra
    ctx.fillStyle = gradient;
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(x, y, size, size);

    // Resetear sombra
    ctx.shadowBlur = 0;

    // Dibujar borde
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(
        x - borderWidth / 2,
        y - borderWidth / 2,
        size + borderWidth,
        size + borderWidth
    );

    // Dibujar imagen especial si corresponde
    if (specialImage && imgs?.[specialImage]?.complete) {
        ctx.drawImage(imgs[specialImage], x, y, 1, 1);
    }
}

/**
 * Determina si un color corresponde a una imagen especial
 * @param {string} color - Color de la pieza
 * @returns {string|null} Nombre de la imagen o null
 */
function getSpecialImage(color) {
    if (color === 'ghost') return 'ghost';
    if (color === 'christmas') return 'christmas';
    return null;
}

// ============================================================================
// TEXTO DE SCORE EN LÍNEAS COMPLETADAS
// ============================================================================

/**
 * Muestra el score en las líneas completadas
 * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
 * @param {number} score - Score a mostrar
 * @param {number} linePosition - Posición Y de la línea
 */
export function showScoreOnCompletedLines(ctx, score, linePosition) {
    const text = `+${score}`;
    const textX = 5;
    const textY = linePosition;

    // Configurar fuente
    ctx.font = `bold 2px 'Comic Sans MS'`;

    // Dibujar borde del texto (doble borde para mejor legibilidad)
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 0.5;
    ctx.strokeText(text, textX, textY);

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 0.2;
    ctx.strokeText(text, textX, textY);

    // Rellenar texto
    ctx.fillStyle = 'orange';
    ctx.fillText(text, textX, textY);
}

// ============================================================================
// ANIMACIÓN DE BONUS
// ============================================================================

/**
 * Dibuja la animación de bonus activo
 * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
 * @param {string} text - Texto del bonus (ej: "X3")
 * @param {number} timeBonus - Tiempo restante en ms
 * @param {number} maxTime - Tiempo máximo en ms
 * @param {number} linePosition - Posición Y del bonus
 */
export function bonus(ctx, text, timeBonus, maxTime = 5000, linePosition = 2) {
    const centerX = 1.6;
    const centerY = linePosition - 0.3;
    const radius = 0.8;

    // Fondo blanco del círculo
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();

    // Calcular ángulo de progreso
    const progress = timeBonus / maxTime;
    const angle = progress * 2 * Math.PI;

    // Dibujar progreso
    ctx.beginPath();
    ctx.arc(centerX, centerY, 1, -Math.PI / 2, -Math.PI / 2 + angle);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 0.4;
    ctx.stroke();

    // Dibujar texto del bonus
    ctx.font = `bold 1px 'Comic Sans MS'`;

    // Borde del texto
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 0.3;
    ctx.strokeText(text, 1, linePosition);

    // Relleno del texto
    ctx.fillStyle = 'orange';
    ctx.fillText(text, 1, linePosition);
}

// ============================================================================
// TEXTO DE BONUS EN CELDAS
// ============================================================================

/**
 * Dibuja el texto de bonus en una celda del tablero
 * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
 * @param {number} x - Posición X
 * @param {number} y - Posición Y
 * @param {string} text - Texto a mostrar (ej: "X2")
 */
export function drawSquareWithBonus(ctx, x, y, text) {
    ctx.font = `bold 0.6px 'Comic Sans MS'`;

    const textX = x + 0.1;
    const textY = y + 0.7;

    // Borde blanco exterior
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 0.2;
    ctx.strokeText(text, textX, textY);

    // Borde negro interior
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 0.1;
    ctx.strokeText(text, textX, textY);

    // Relleno naranja
    ctx.fillStyle = 'orange';
    ctx.fillText(text, textX, textY);
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Limpia completamente el canvas
 * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
 * @param {number} width - Ancho del canvas
 * @param {number} height - Alto del canvas
 */
export function clearCanvas(ctx, width, height) {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
}

/**
 * Dibuja un grid de ayuda (útil para debugging)
 * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
 * @param {number} width - Ancho en celdas
 * @param {number} height - Alto en celdas
 */
export function drawGrid(ctx, width, height) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 0.02;

    // Líneas verticales
    for (let x = 0; x <= width; x++) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }

    // Líneas horizontales
    for (let y = 0; y <= height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
}