function getRandomColor() {
    const colors = [
        'red',
        'blue',
        'green',
        'yellow',
        'purple',
        'orange',
        'cyan',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

export const drawSquare = (ctx, x, y, color, color2 = 'white', borderWidth = 0.08, borderColor = black, isBonus = false, imgs = null) => {
    const size = 1; // Tamaño del cuadrado

    let img = (color === 'ghost') ? 'ghost' : '';
    img = (color === 'christmas') ? 'christmas' : img;
    
    if(img == 'ghost'){
        color =  color2 = 'black';
    }

    if(img == 'christmas'){
        color =  color2 = 'black';
    }
    

    const gradient = ctx.createLinearGradient(x, y, x + size, y + size);

    
    if(isBonus){
        color = getRandomColor();
    }

    gradient.addColorStop(0, color);
    gradient.addColorStop(1, color2);


    // Establecer el color de relleno y aplicar sombra
    ctx.fillStyle = gradient;
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    
    // Dibujar el cuadrado
    ctx.fillRect(x, y, size, size);

    // Resetear la sombra
    ctx.shadowBlur = 0;

    // Establecer el estilo y el grosor del borde
    ctx.strokeStyle = borderColor; // Color del borde
    ctx.lineWidth = borderWidth; // Grosor del borde

    // Dibujar el borde del cuadrado
    ctx.strokeRect(x - borderWidth / 2, y - borderWidth / 2, size + borderWidth, size + borderWidth);

    if(img === 'ghost'){
        if (imgs?.ghost?.complete) { // Comprueba si la imagen se ha cargado completamente
            ctx.drawImage(imgs.ghost, x, y, 1, 1); // Ajusta las posiciones y el tamaño según sea necesario
        }
    }

    if(img === 'christmas'){
        if (imgs?.christmas?.complete) { // Comprueba si la imagen se ha cargado completamente
            ctx.drawImage(imgs.christmas, x, y, 1, 1); // Ajusta las posiciones y el tamaño según sea necesario
        }
    }


};

export const showScoreOnCompletedLines = (ctx, newScore, linePosition ) => {
    const text = `+${newScore}`;
    const textX = 5; // Centrar el texto en el ancho del tablero
    const textY = linePosition; // Ajustar la posición y al centro de la fila completada

    // Establecer el estilo de la fuente para hacerla más gruesa
    ctx.font = `bold 2px 'Comic Sans MS'`; // Fuente más gruesa

    // Primero, dibujar el borde del texto
    ctx.strokeStyle = 'white'; // Color del borde
    ctx.lineWidth = 0.5; // Ancho del borde
    ctx.strokeText(text, textX, textY);
    ctx.strokeStyle = 'black'; // Color del borde
    ctx.lineWidth = 0.2; // Ancho del borde
    ctx.strokeText(text, textX, textY);

    // Luego, rellenar el texto
    ctx.fillStyle = 'orange'; // Color morado claro
    ctx.fillText(text, textX, textY);
};

export const bonus = (ctx, text, timeBonus, maxTime = 5, linePosition = 2) => {
    const textX = 1; // Centrar el texto en el ancho del tablero
    const textY = linePosition; // Ajustar la posición y al centro de la fila completada

       // Establecer el estilo de la fuente para hacerla más gruesa
       ctx.font = `bold 1px 'Comic Sans MS'`; // Fuente más gruesa

    
    // dibujar un circulo
    ctx.beginPath();
    ctx.arc(textX +0.6, textY - 0.3, 0.8, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();

    const angle = (timeBonus / maxTime) * 2 * Math.PI;
   
    // dibujar un circulo sin relleno
    // ctx.beginPath();
    // ctx.arc(textX + 0.6, textY - 0.3, 1, 0 , 2 * Math.PI);
    // ctx.strokeStyle = 'red';
    // ctx.lineWidth = 0.4;
    // ctx.stroke();

    ctx.beginPath();
    ctx.arc(textX + 0.6, textY - 0.3, 1, 0 , angle);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 0.4;
    ctx.stroke();

    // Primero, dibujar el borde del texto
    ctx.strokeStyle = 'black'; // Color del borde
    ctx.lineWidth = 0.3; // Ancho del borde
    ctx.strokeText(text, textX, textY);

    // Luego, rellenar el texto
    ctx.fillStyle = 'orange'; // Color morado claro
    ctx.fillText(text, textX, textY);


}

export const drawSquareWithBonus = (ctx, x, y, text ) => {

     // Establecer el estilo de la fuente para hacerla más gruesa
     ctx.font = `bold 0.6px 'Comic Sans MS'`; // Fuente más gruesa

    x= x+0.1;
    y= y+0.7;

     // Primero, dibujar el borde del texto
     ctx.strokeStyle = 'white'; // Color del borde
     ctx.lineWidth = 0.2; // Ancho del borde
     ctx.strokeText(text, x, y);
     ctx.strokeStyle = 'black'; // Color del borde
     ctx.lineWidth = 0.1; // Ancho del borde
     ctx.strokeText(text, x, y);
 
     // Luego, rellenar el texto
     ctx.fillStyle = 'orange'; // Color morado claro
     ctx.fillText(text, x, y);

};