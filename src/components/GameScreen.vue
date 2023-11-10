<script setup>
import {HEIGHT_TOP, HEIGHT_JOYSTICK,HEIGHT_CANVAS, BLOCK_SIZE, BOARD_WIDTH, BOARD_HEIGHT, EVENT_MOVEMENTS, ISMOVIL, ISDESKTOP} from '/src/utils/consts.js';
import { ref, onMounted, onBeforeUnmount, reactive, defineEmits } from 'vue';
import { PIECES, DIFFICULTY } from '/src/utils/pieces.js';

const difficulty = ref(DIFFICULTY.EASY);
const pieces = ref(PIECES[difficulty.value]);


const emit = defineEmits(['gameOver'])

const gameOver = () => {
    emit('gameOver')
    board.forEach((row) => row.fill(0));
    score.value = 0;
    alert('Game Over');
}

const canvas  = ref(null);
const context = ref(null);

const score = ref(0);
let time = ref(0);

const createBoard = (width, height) => {
  return Array.from({ length: height }, () => new Array(width).fill(0))
}

const getNewPiece = () => {
//   return  pieces.value[Math.floor(Math.random() * pieces.value.length)]
return [
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
}

const board = createBoard(BOARD_WIDTH, BOARD_HEIGHT);

const piece = reactive({
  position: { x: 5, y: 5 },
  matrix: pieces.value[Math.floor(Math.random() * pieces.value.length)],
});

let dropCounter = 0;
let lastTime = 0;
let animationFrameId;



onMounted(() => {
    piece.matrix = getNewPiece();
    canvas.value.width = BLOCK_SIZE * BOARD_WIDTH;
    canvas.value.height = BLOCK_SIZE * BOARD_HEIGHT;
    context.value = canvas.value.getContext('2d');
    context.value.scale(BLOCK_SIZE, BLOCK_SIZE);
    startGame();

    window.addEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(() => {
  window.cancelAnimationFrame(animationFrameId);

  window.removeEventListener('keydown', handleKeyDown);
});


const startGame = () => {
  // Inicia el loop del juego
  animationFrameId = window.requestAnimationFrame(update);
  // Añadir otros inicializadores aquí si es necesario

}

const update = (timestamp = 0) => {
  time = Math.floor(timestamp / 1000)
  // Actualiza el estado del juego
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;
  dropCounter += deltaTime;
  if (dropCounter > 1000) {
    drop();
  }
  draw();
  window.requestAnimationFrame(update);
}

const drop = () => {
  piece.position.y++;
  if (checkCollision()) {
      piece.position.y--
      solidifyPiece()
      removeLines()
    }
  dropCounter = 0;
}

function drawRoundedSquare(ctx, x, y, width, height, radius, color) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();

  ctx.fillStyle = color;
  ctx.fill();
}



const drawSquare = (ctx, x, y, color) => {
  const gradient = ctx.createLinearGradient(x, y, x + 1, y + 1);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'white');

  ctx.fillStyle = gradient;
  ctx.shadowBlur = 20;
  ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
  ctx.fillRect(x, y, 1, 1);

  // Reset shadow after drawing
  ctx.shadowBlur = 0;
};

const draw = () => {
  // Dibuja el fondo del juego
  context.value.fillStyle = '#000';
  context.value.fillRect(0, 0, canvas.value.width, canvas.value.height);

  // Dibuja el tablero
  board.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value > 0) {
        drawSquare(context.value, x, y, 'blue');
        // drawRoundedSquare(context.value, x, y, 1, 1, 0.2, 'blue');
      }
    });
  });

  // Dibuja las piezas
  piece.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value > 0) {
        drawSquare(context.value, piece.position.x + x, piece.position.y + y, 'green');
        // drawRoundedSquare(context.value, piece.position.x + x, piece.position.y + y, 1, 1, 0.2, 'green');
    }
    });
  });
};


const checkCollision = () => {
    return piece.matrix.find((row, y) => {
        return row.find((value, x) => {
        return value !== 0 &&  board[piece.position.y + y] ?. [piece.position.x + x] !== 0
        })
    }
    )
}


// Manejador de eventos para pulsaciones de tecla
function handleKeyDown(event) {
    if (event.key === EVENT_MOVEMENTS.LEFT) {
        left();
    } else if (event.key === EVENT_MOVEMENTS.RIGHT) {
        right();
    } else if (event.key === EVENT_MOVEMENTS.DOWN) {
        down();
    } else if (event.key === EVENT_MOVEMENTS.ROTATE) {
        rotate();
    } else  if (event.key === EVENT_MOVEMENTS.SPACE) {
        speedDown();   
    }
}

const rotate = () => {
  const matrix = piece.matrix;
  const N = matrix.length - 1;
  const result = matrix.map((row, i) =>
    row.map((val, j) => matrix[N - j][i])
  );
  piece.matrix = result;
  if (checkCollision()) {
    piece.matrix = matrix;
  }
};

const solidifyPiece = () => {
  piece.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value > 0) {
        board[piece.position.y + y][piece.position.x + x] = value;
      }
    });
  });
    piece.matrix = getNewPiece();
    piece.position.y = 0;
    piece.position.x = Math.floor((BOARD_WIDTH - piece.matrix[0].length) / 2);
    if (checkCollision()) {
      gameOver();
    }
};

const removeLines = () => {
  let lines = 0;
  board.forEach((row, y) => {
    if (row.every((value) => value > 0)) {
      lines++;
      board.splice(y, 1);
      board.unshift(Array(BOARD_WIDTH).fill(0));
    }
  });
  if (lines > 0) {
    score.value += lines * 10;
  }
};

const down = () => {
  piece.position.y++;
  if (checkCollision()) {
    piece.position.y--;
    solidifyPiece();
    removeLines();
  }
};

const left = () => {
  piece.position.x--;
  if (checkCollision()) {
    piece.position.x++;
  }
};

const right = () => {
  piece.position.x++;
  if (checkCollision()) {
    piece.position.x--;
  }
};

const pause = () => {
  if (animationFrameId) {
    window.cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  } else {
    animationFrameId = window.requestAnimationFrame(update);
  }
};

const restart = () => {
  board.forEach((row) => row.fill(0));
  score.value = 0;
  startGame();
};

const setDifficulty = (newDifficulty) => {
  difficulty.value = newDifficulty;
  pieces.value = PIECES[difficulty.value];
  restart();
};

const speedDown = () => {
    let enter = false;
    while (!enter) {
    piece.position.y++;
    if (checkCollision()) {
      enter = true;
      piece.position.y--;
      solidifyPiece();
      removeLines();
    }
  }
};






</script>

<template>
    <div class="grid justify-center">
        <article class=""  :style="{ height: HEIGHT_TOP + 'px' }">
            <div class="flex flex-col">
                <strong> Dificultad: <span ref="difficulty"></span></strong>
                <strong> Puntaje: <span>{{ score }}</span> </strong>
                <strong> Tiempo: <span ref="time"></span> </strong>
            <!-- <strong> Nivel: <span id="lines"></span>  </strong>
                <strong> Posición: <span id="lines"></span> </strong> -->
            </div>
        </article>
        
        <article class="flex gap-4" :style="{ height: HEIGHT_CANVAS + 'px' }">
            <div class="" >
                <canvas ref="canvas"></canvas>
            </div>
            <div class="border h-20 w-20" >
            </div>
        </article>
        <article v-if="ISMOVIL" id="buttons_movil" class=" flex justify-between items-center" :style="{ height: HEIGHT_JOYSTICK + 'px' }">
            <div>
                <button @click="rotate()" class="text-7xl ml-16">▲</button>
                <div class="flex-between ml-3 -mt-3">
                    <button @click="left()" class="text-7xl rotate-90">▼ </button>
                    <button @click="right()" class="text-7xl rotate-90 ml-[3.25rem]">▲</button>
                </div>
                <button @click="down()" class="text-7xl ml-16 -mt-5">▼ </button>
            </div>
            <div class="pr-4">
                <button @click="speedDown()" class="text-9xl">○</button>
            </div>
        </article>
    </div>
</template>

<style scoped>
canvas {
  border-radius: 15px; /* Redondea las esquinas del canvas */
  border: solid 2px #ffffff; /* Crea un borde sólido blanco */
  
  /* Agrega un brillo alrededor del canvas */
  box-shadow: 
    0 0 5px #ffffff,
    0 0 10px #ffffff,
    /* 0 0 15px #ff00de, */
    /* 0 0 20px #ff00de,  */
    /* 0 0 25px #ff00de, */
    /* 0 0 30px #ff00de, */
    /* 0 0 35px #ff00de; */
}
</style>