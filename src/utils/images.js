import { ISPRODUCTION, ISDESKTOP } from './consts'

export function getBgImg(theme){

    if(ISPRODUCTION){
        if(ISDESKTOP){
            return `url("https://raw.githubusercontent.com/santiagoinostroza/tetris-game/main/img/${theme}/bg.avif")`
        }else{
           return `url('https://raw.githubusercontent.com/santiagoinostroza/tetris-game/main/img/${theme}/bg_movil.avif')`
        }
    }else{
        if(ISDESKTOP){
            return `url("./img/${theme}/bg.avif")`
        }else{
            return `url('./img/${theme}/bg_movil.avif')`
        }
    }


   
}


export const PIECES_IMAGES = {
    ghost: new Image(),
}


if(ISPRODUCTION){
    PIECES_IMAGES.ghost.src = 'https://raw.githubusercontent.com/santiagoinostroza/tetris-game/main/src/assets/img/pieces/ghost.png';
}else{
    PIECES_IMAGES.ghost.src = '/src/assets/img/pieces/ghost.png';
}

console.log(PIECES_IMAGES.ghost.src)