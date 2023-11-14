export const ISMOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

export const SCREENHEIGHT = window.innerHeight;
export const SCREENWIDTH = window.innerWidth;


export const HEIGHT_JOYSTICK = "160"
export const HEIGHT_TOP = "70"
export const HEIGHT_CANVAS = ISMOBILE ? SCREENHEIGHT - HEIGHT_JOYSTICK -HEIGHT_TOP -50 : SCREENHEIGHT -15;


export const BOARD_WIDTH = 16
export const BOARD_HEIGHT = 28
export const BLOCK_SIZE = HEIGHT_CANVAS / BOARD_HEIGHT
export const CANVAS_WIDTH = BOARD_WIDTH * BLOCK_SIZE
export const ISPRODUCTION = import.meta.env.MODE === 'production' ;
export const ISDESKTOP = !ISMOBILE;





export const EVENT_MOVEMENTS = {
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight',
    DOWN: 'ArrowDown',
    ROTATE: 'ArrowUp',
    SPACE: ' ',
}

export const DIRECTIONS = {
    LEFT: 'left',
    RIGHT: 'right',
    DOWN: 'down',
    ROTATE: 'rotate',
    SPACE: 'space',
}

