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
    return Array.from({ length: height }, () => new Array(width).fill(0))
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
    return piece.matrix.find((row, y) => {
        return row.find((value, x) => {
            return value !== 0 &&  board[piece.position.y + y] ?. [piece.position.x + x] !== 0
        })
    })
}