export const ISMOVIL = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

export const SCREENHEIGHT = window.innerHeight;

export const HEIGHT_TOP = "100";
export const HEIGHT_JOYSTICK = "180"
export const HEIGHT_CANVAS = ISMOVIL ? SCREENHEIGHT - HEIGHT_TOP - HEIGHT_JOYSTICK -15 : SCREENHEIGHT - HEIGHT_TOP -15;


export const BOARD_WIDTH = 14
export const BOARD_HEIGHT = 28
export const BLOCK_SIZE = HEIGHT_CANVAS / BOARD_HEIGHT
export const ISPRODUCTION = import.meta.env.MODE === 'production' ;
export const ISDESKTOP = !ISMOVIL;





export const EVENT_MOVEMENTS = {
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight',
    DOWN: 'ArrowDown',
    ROTATE: 'ArrowUp',
    SPACE: ' ',
}

