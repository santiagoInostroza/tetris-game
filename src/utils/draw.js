export const drawSquare = (ctx, x, y, color, borderWidth = 0.08) => {
    const size = 1; // Tamaño del cuadrado
    const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'white');

    // Establecer el color de relleno y aplicar sombra
    ctx.fillStyle = gradient;
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    
    // Dibujar el cuadrado
    ctx.fillRect(x, y, size, size);

    // Resetear la sombra
    ctx.shadowBlur = 0;

    // Establecer el estilo y el grosor del borde
    ctx.strokeStyle = 'white'; // Color del borde
    ctx.lineWidth = borderWidth; // Grosor del borde

    // Dibujar el borde del cuadrado
    ctx.strokeRect(x - borderWidth / 2, y - borderWidth / 2, size + borderWidth, size + borderWidth);
};

export const showScoreOnCompletedLines = (ctx, newScore, linePosition ) => {
    const text = `+ ${newScore}`;
    const textX = 5; // Centrar el texto en el ancho del tablero
    const textY = linePosition; // Ajustar la posición y al centro de la fila completada

    // Establecer el estilo de la fuente para hacerla más gruesa
    ctx.font = `bold 2px 'Comic Sans MS'`; // Fuente más gruesa

    // Primero, dibujar el borde del texto
    ctx.strokeStyle = 'white'; // Color del borde
    ctx.lineWidth = 0.2; // Ancho del borde
    ctx.strokeText(text, textX, textY);

    // Luego, rellenar el texto
    ctx.fillStyle = 'orange'; // Color morado claro
    ctx.fillText(text, textX, textY);
};