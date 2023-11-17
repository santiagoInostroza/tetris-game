
import { ISPRODUCTION } from './consts'

const SOUNDS = {
    introSound: null,
    bgMusic: null,
    gameOverSound: null,
    removeLineOneSound: null,
    removeLineTwoSound: null,
    removeLineThreeSound: null,
    removeLineFourSound: null,
    removeLineFiveSound: null,
    collisionSound: null,
    bonusSound: null,
    moveSound: null,
    rotateSound: null,
    speedDownSound: null,


}

const canciones = Array.from({length: 10}, (_, i) => `${i + 1}.mp3`) // array de canciones del 1 al 10



let cancionActual = 0;
let theme1 = null;

selectTheme('tetris')


export function selectTheme(theme) {
    theme1 = theme;
  if (ISPRODUCTION) {
      // SOUNDS.introSound = new Audio(`https://raw.githubusercontent.com/santiagoinostroza/tetris/main/sounds/${theme}/intro.mp3`)
      SOUNDS.bgMusic = new Audio(`https://raw.githubusercontent.com/santiagoinostroza/tetris-game/main/src/assets/sounds/${theme}/bg/${canciones[cancionActual]}`);
      // SOUNDS.gameOverSound = new Audio(`https://raw.githubusercontent.com/santiagoinostroza/tetris/main/src/assets/sounds/${theme}/gameOverSound.mp3`)
      SOUNDS.removeLineOneSound = new Audio(`https://raw.githubusercontent.com/santiagoinostroza/tetris-game/main/src/assets/sounds/${theme}/removeLineOne.mp3`)
      SOUNDS.removeLineTwoSound = new Audio(`https://raw.githubusercontent.com/santiagoinostroza/tetris-game/main/src/assets/sounds/${theme}/removeLineTwo.mp3`)
      SOUNDS.removeLineThreeSound = new Audio(`https://raw.githubusercontent.com/santiagoinostroza/tetris-game/main/src/assets/sounds/${theme}/removeLineThree.mp3`)
      SOUNDS.removeLineFourSound = new Audio(`https://raw.githubusercontent.com/santiagoinostroza/tetris-game/main/src/assets/sounds/${theme}/removeLineFour.mp3`)
      SOUNDS.removeLineFiveSound = new Audio(`https://raw.githubusercontent.com/santiagoinostroza/tetris-game/main/src/assets/sounds/${theme}/removeLineFive.mp3`)
      SOUNDS.collisionSound = new Audio(`https://raw.githubusercontent.com/santiagoinostroza/tetris-game/main/src/assets/sounds/${theme}/collisionSound.mp3`)
      SOUNDS.bonusSound = new Audio(`https://raw.githubusercontent.com/santiagoinostroza/tetris-game/main/src/assets/sounds/${theme}/bonusSound.mp3`)
      SOUNDS.moveSound = new Audio(`https://raw.githubusercontent.com/santiagoinostroza/tetris-game/main/src/assets/sounds/${theme}/moveSound.mp3`)
      SOUNDS.rotateSound = new Audio(`https://raw.githubusercontent.com/santiagoinostroza/tetris-game/main/src/assets/sounds/${theme}/rotateSound.mp3`)
      SOUNDS.speedDownSound = new Audio(`https://raw.githubusercontent.com/santiagoinostroza/tetris-game/main/src/assets/sounds/${theme}/speedDownSound.mp3`)
    } else {
      // SOUNDS.introSound = new Audio(`./sounds/${theme}/intro.mp3`)
      SOUNDS.bgMusic = new Audio(`/src/assets/sounds/${theme}/bg/${canciones[cancionActual]}`);
      // SOUNDS.gameOverSound = new Audio(`./sounds/${theme}/gameOverSound.mp3`)
      SOUNDS.removeLineOneSound = new Audio(`/src/assets/sounds/${theme}/removeLineOne.mp3`)
      SOUNDS.removeLineTwoSound = new Audio(`/src/assets/sounds/${theme}/removeLineTwo.mp3`)
      SOUNDS.removeLineThreeSound = new Audio(`/src/assets/sounds/${theme}/removeLineThree.mp3`)
      SOUNDS.removeLineFourSound = new Audio(`/src/assets/sounds/${theme}/removeLineFour.mp3`)
      SOUNDS.removeLineFiveSound = new Audio(`/src/assets/sounds/${theme}/removeLineFive.mp3`)
      
      SOUNDS.collisionSound = new Audio(`/src/assets/sounds/${theme}/collisionSound.mp3`)
      SOUNDS.bonusSound = new Audio(`/src/assets/sounds/${theme}/bonusSound.mp3`)
      SOUNDS.moveSound = new Audio(`/src/assets/sounds/${theme}/moveSound.mp3`)
      SOUNDS.rotateSound = new Audio(`/src/assets/sounds/${theme}/rotateSound.mp3`)
      SOUNDS.speedDownSound = new Audio(`/src/assets/sounds/${theme}/speedDownSound.mp3`)
    }

  }

  export function startIntroAudio() {
    SOUNDS.introSound.loop = true
    SOUNDS.introSound.play()
  }

  export function stopIntroAudio() {
    
    SOUNDS.introSound.pause()
    SOUNDS.introSound.currentTime = 0
  }


  export function startGameAudio() {
    
    SOUNDS.bgMusic.addEventListener("ended", function () {
      reproducirSiguienteCancion();
    });
    
    SOUNDS.bgMusic.volume = 0.5
    SOUNDS.bgMusic.play()
    .then(() => {}).catch(error => {
     
    })
          
    SOUNDS.bgMusic.addEventListener('error', function(event) {
      cancionActual = 0;
      SOUNDS.bgMusic.load();
      SOUNDS.bgMusic = new Audio(`/src/assets/sounds/${theme1}/bg/${canciones[cancionActual]}`);
      startGameAudio();
    });
  }

  function reproducirSiguienteCancion() {
      cancionActual++;
      SOUNDS.bgMusic.src = `/src/assets/sounds/${theme1}/bg/${canciones[cancionActual]}`;
      startGameAudio();
  }

  export function stopGameAudio() {
    SOUNDS.bgMusic.pause()
    SOUNDS.bgMusic.currentTime = 0
    SOUNDS.bgMusic.removeEventListener("ended", reproducirSiguienteCancion);
    SOUNDS.bgMusic.removeEventListener("error", reproducirSiguienteCancion);
  }

  export function startGameOverAudio() {
    SOUNDS.gameOverSound.play()
  }

  export function startRemoveLineOneSound() {
    SOUNDS.removeLineOneSound.currentTime = 0
    SOUNDS.removeLineOneSound.volume = 1
    SOUNDS.removeLineOneSound.play()
  }

  export function startRemoveLineTwoSound() {
    SOUNDS.removeLineTwoSound.currentTime = 0
    SOUNDS.removeLineTwoSound.volume = 1
    SOUNDS.removeLineTwoSound.play()
  }

  export function startRemoveLineThreeSound() {
    SOUNDS.removeLineThreeSound.currentTime = 0
    SOUNDS.removeLineThreeSound.volume = 1
    SOUNDS.removeLineThreeSound.play()
  }

  export function startRemoveLineFourSound() {
    SOUNDS.removeLineFourSound.currentTime = 0
    SOUNDS.removeLineFourSound.volume = 1
    SOUNDS.removeLineFourSound.play()
  }

  export function startRemoveLineFiveSound() {
    SOUNDS.removeLineFiveSound.currentTime = 0
    SOUNDS.removeLineFiveSound.volume = 1
    SOUNDS.removeLineFiveSound.play()
  }
  
  export function startCollisionSound(){
    SOUNDS.collisionSound.currentTime = 0
    SOUNDS.collisionSound.volume = 1
    SOUNDS.collisionSound.play()
  }

  export function pauseGameAudio() {
    SOUNDS.bgMusic.pause()
  }

  export function resumeGameAudio() {
    SOUNDS.bgMusic.play()
  }

  export function startBonusSound() {
    SOUNDS.bonusSound.volume = 0.5
     SOUNDS.bonusSound.play()
  }

  export function stopBonusSound() {
    SOUNDS.bonusSound.pause()
    SOUNDS.bonusSound.currentTime = 0
  }

  export function pauseBonusSound() {
    SOUNDS.bonusSound.pause()
  }

  export function startMoveSound() {
    SOUNDS.moveSound.play()
    setTimeout(() => {
      SOUNDS.moveSound.pause()
      SOUNDS.moveSound.currentTime = 0
    }, 50);
  }

  export function startRotateSound() {
    SOUNDS.rotateSound.play()
    setTimeout(() => {
      SOUNDS.rotateSound.pause()
      SOUNDS.rotateSound.currentTime = 0
    }, 50);
  }

  export function startSpeedDownSound() {
    SOUNDS.speedDownSound.currentTime = 0.2
    SOUNDS.speedDownSound.play()
  }


  