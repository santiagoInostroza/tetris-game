export const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Añade ceros iniciales si los números son menores de 10
    const hoursFormatted = hours.toString().padStart(2, '0');
    const minutesFormatted = minutes.toString().padStart(2, '0');
    const secondsFormatted = seconds.toString().padStart(2, '0');

    // Formato de salida: "HH:MM:SS"
    return `${hoursFormatted}:${minutesFormatted}:${secondsFormatted}`;
};

export const createBoard = (width, height) => {
    // necesito que el 1 % de veces me salga un 1 y el resto 0
    let bonus = Math.floor(Math.random() * 100)
    return Array.from({ length: height }, () => 
        Array.from({ length: width }, () => ({ 
            value: 0, 
            color: null ,
            bonus: bonus > 5 ? true : false,
        }))
    );
}

export const getNewPiece = (pieces, colors) => {
    let num = Math.floor(Math.random() * pieces.length)
    return  [
        pieces[num],
        colors[num],
    ]
    // return pieces.value[4]
}
export const checkCollision = (board, piece) => {
    for (let y = 0; y < piece.matrix.length; ++y) {
        for (let x = 0; x < piece.matrix[y].length; ++x) {
            // Verificar si la celda de la pieza está ocupada
            if (piece.matrix[y][x] !== 0) {
                // Calcular la posición actual en el tablero
                const currentX = piece.position.x + x;
                const currentY = piece.position.y + y;

                // Verificar si la posición está fuera del tablero (debajo o a los lados)
                if (currentX < 0 || currentX >= board[0].length || currentY >= board.length) {
                    return true;
                }

                // Verificar si la celda del tablero está ocupada
                if (board[currentY] && board[currentY][currentX] && board[currentY][currentX].value !== 0) {
                    return true;
                }
            }
        }
    }
    return false;
};
