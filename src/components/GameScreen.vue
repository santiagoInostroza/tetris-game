<script setup>
    import {ISMOBILE, ISDESKTOP, HEIGHT_JOYSTICK,HEIGHT_CANVAS, BLOCK_SIZE, BOARD_WIDTH, BOARD_HEIGHT, EVENT_MOVEMENTS, SCREENWIDTH, CANVAS_WIDTH} from '/src/utils/consts.js';
    import { ref, onMounted, onBeforeUnmount, reactive, defineEmits } from 'vue';
    import { PIECES, DIFFICULTY } from '/src/utils/pieces.js';


    const difficulty = ref(DIFFICULTY.MEDIUM);
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
    const newScore = ref(0);
    const time = ref('00:00:00')

    const createBoard = (width, height) => {
        return Array.from({ length: height }, () => new Array(width).fill(0))
    }

    const getTwoPieces = () => {
        return  pieces.value[Math.floor(Math.random() * pieces.value.length)]
        // return pieces.value[4]
    }

    const getNewPiece = () => {
        return  pieces.value[Math.floor(Math.random() * pieces.value.length)]
        // return pieces.value[4]
    }

    const board = createBoard(BOARD_WIDTH, BOARD_HEIGHT);

    const piece = reactive({
        position: { x: 5, y: 5 },
        matrix: pieces.value[Math.floor(Math.random() * pieces.value.length)],
    });

    let dropCounter = 0;
    let lastTime = 0;
    let animationFrameId;

    const isPaused = ref(true);
    
    let activeGameTime = 0; // Tiempo total de juego activo
    let lastUpdateTime = 0; // Última vez que se actualizó el juego

   

    onMounted(() => {
        piece.matrix = getNewPiece();
        canvas.value.width = BLOCK_SIZE * BOARD_WIDTH;
        canvas.value.height = BLOCK_SIZE * BOARD_HEIGHT;
        context.value = canvas.value.getContext('2d');
        context.value.scale(BLOCK_SIZE, BLOCK_SIZE);
        startGame();
        
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
       
    });

    onBeforeUnmount(() => {
        window.cancelAnimationFrame(animationFrameId);

        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    });


    const startGame = () => {
        // Inicia el loop del juego
        isPaused.value = false;
        animationFrameId = window.requestAnimationFrame(update);
        // Añadir otros inicializadores aquí si es necesario

    }

    const formatTime = (totalSeconds) => {
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

    const pause = () => {
        if (!isPaused.value) {
            window.cancelAnimationFrame(animationFrameId);
            isPaused.value = true;
        } else {
            lastUpdateTime = performance.now();
            animationFrameId = window.requestAnimationFrame(update);
            isPaused.value = false;
        }
    };


   

    const update = (timestamp) => {
        if (!isPaused.value) {
            if (lastUpdateTime === 0) {
                lastUpdateTime = timestamp;
            }

            const deltaTime = timestamp - lastUpdateTime;
            activeGameTime += deltaTime; // Incrementar solo el tiempo de juego activo

            const secondsElapsed = Math.floor(activeGameTime / 1000);
            time.value = formatTime(secondsElapsed);

            dropCounter += deltaTime;
            if (dropCounter > 1000) {
                down();
                dropCounter = 0;
            }
            draw();
        }

        lastUpdateTime = timestamp;
        animationFrameId = window.requestAnimationFrame(update);
    };

   



    const drawSquare = (ctx, x, y, color, borderWidth = 0.08) => {
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


    let shouldShowScore = true;
    let linePosition = 0;
  

    const draw = () => {

        // Dibuja el fondo del juego
        context.value.fillStyle = 'black';
        context.value.fillRect(0, 0, canvas.value.width, canvas.value.height);      
        
        
        // Dibuja el tablero
        board.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    drawSquare(context.value, x, y, 'blue');
                }
            });
        });
        
        
        // // Dibuja las piezas
        piece.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    drawSquare(context.value, piece.position.x + x, piece.position.y + y, 'green');
                }
            });
        });

        if(shouldShowScore){
            showScoreOnCompletedLines()
        } 


    };

    
    
    const showScoreOnCompletedLines = () => {
        const text = `+ ${newScore.value}`;
        const textX = 5; // Centrar el texto en el ancho del tablero
        const textY = linePosition; // Ajustar la posición y al centro de la fila completada

        // Establecer el estilo de la fuente para hacerla más gruesa
        context.value.font = `bold 2px 'Comic Sans MS'`; // Fuente más gruesa

        // Primero, dibujar el borde del texto
        context.value.strokeStyle = 'white'; // Color del borde
        context.value.lineWidth = 0.2; // Ancho del borde
        context.value.strokeText(text, textX, textY);

        // Luego, rellenar el texto
        context.value.fillStyle = 'orange'; // Color morado claro
        context.value.fillText(text, textX, textY);
    };


 

    const checkCollision = () => {
        return piece.matrix.find((row, y) => {
            return row.find((value, x) => {
            return value !== 0 &&  board[piece.position.y + y] ?. [piece.position.x + x] !== 0
            })
        })
    }



    let keysPressed = {};

    function handleKeyDown(event) {
        keysPressed[event.key] = true; // Marcar la tecla como presionada

        if (keysPressed[EVENT_MOVEMENTS.LEFT]) {
            left();
        } else if (keysPressed[EVENT_MOVEMENTS.RIGHT]) {
            right();
        }
        if (keysPressed[EVENT_MOVEMENTS.DOWN]) {
            down();
            dropCounter = 0;
        }

        if (event.key === EVENT_MOVEMENTS.ROTATE) {
            rotate();
        } else if (event.
        key === EVENT_MOVEMENTS.SPACE) {
            speedDown();   
        } 
    }

    function handleKeyUp(event) {
        delete keysPressed[event.key]; // Marcar la tecla como no presionada
        if (keysPressed[EVENT_MOVEMENTS.DOWN]) {
            down();
            dropCounter = 0;
        }
    }

    // left
    let isMovingLeft = false;
    let speed =120;

    function startMovingLeft() {
        isMovingLeft = true;
        moveLeftContinuously();
    }

    function stopMovingLeft() {
        isMovingLeft = false;
    }

    function moveLeftContinuously() {
        if (isMovingLeft) {
            left();
            setTimeout(moveLeftContinuously, speed); // Ajusta este valor según la rapidez con la que quieras que se mueva
        }
    }

    // right
    let isMovingRight = false;

    function startMovingRight() {
        isMovingRight = true;
        moveRightContinuously();
    }

    function stopMovingRight() {
        isMovingRight = false;
    }

    function moveRightContinuously() {
        if (isMovingRight) {
            right();
            setTimeout(moveRightContinuously, speed); // Ajusta este valor según la rapidez con la que quieras que se mueva
        }
    }

    // down
    let isMovingDown = false;

    function startMovingDown() {
        isMovingDown = true;
        moveDownContinuously();
        dropCounter = 0;

    }

    function stopMovingDown() {
        isMovingDown = false;
        dropCounter = 0;
    }

    function moveDownContinuously() {
        if (isMovingDown) {
            down();
            setTimeout(moveDownContinuously, speed); // Ajusta este valor según la rapidez con la que quieras que se mueva
            dropCounter = 0;
        }
    }

    // rotate
    let isRotating = false;

    function startRotating() {
        isRotating = true;
        rotateContinuously();
    }

    function stopRotating() {
        isRotating = false;
    }

    function rotateContinuously() {
        if (isRotating) {
            rotate();
            setTimeout(rotateContinuously, speed *4); // Ajusta este valor según la rapidez con la que quieras que se mueva
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
                linePosition = y;
                board.splice(y, 1);
                board.unshift(Array(BOARD_WIDTH).fill(0));
            }
        });
        if (lines > 0) {
            newScore.value = (lines * 10) ** 2;
            score.value += newScore.value;
            shouldShowScore = true;

            setTimeout(() => {
                shouldShowScore = false;
                linePosition = 0;

            }, 1200);
            
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

        <!-- MODAL -->
        <article v-if="ISMOBILE && isPaused">
            <div class="w-screen h-screen absolute bg-gray-800 opacity-90 z-10 left-0 top-0 ">
            </div>
            <div class="absolute left-0 top-0 h-full w-full z-10 grid items-center justify-center">
                <!-- titulo opciones -->
                <h2 class="font-bold text-3xl text-gray-300 text-center mb-4 p-4 ">OPCIONES</h2>
                
                <div class="shadow border p-4 rounded-xl text-sm bg-gradient-to-r from-gray-400 to-gray-500 border-shine">
                    <div class="grid grid-cols-2 gap-4 items-center text-xl">
                        <p class="text-center font-bold uppercase">Dificultad</p>
                        <div class="text-center ">
                            <p v-if="difficulty == DIFFICULTY.EASY" >FACIL</p>
                            <p v-if="difficulty == DIFFICULTY.MEDIUM">MEDIA</p>
                            <p v-if="difficulty == DIFFICULTY.HARD">DIFICIL</p>
                        </div>
                    </div>
                    
                </div>
                

                <article class="flex gap-4 flex-col items-center justify-center">
                    <button @click="pause" class="text-xl md:text-2xl border rounded-2xl p-3 w-72 md:w-[35rem] bg-gradient-to-r from-green-600 to-green-800  border-shine font-extrabold" >CONTINUAR</button>
                    <div class="flex gap-4 flex-col md:flex-row">
                        <button @click="gameOver" class="text-xl md:text-2xl border rounded-2xl p-4 w-72 md:w-[17rem] bg-gradient-to-r from-red-600 to-red-800 border-shine font-extrabold">IR AL MENU</button>
                    </div>
                </article>



            </div>
        </article>


        <article v-if="ISMOBILE" class="shadow rounded py-2">
            <div class="flex justify-between w-screen px-4">
                <!-- SCORE-->
                <div class="p-1 border-4 border-shine rounded-xl relative w-32 mt-4 text-center bg-gradient-to-r from-blue-600 to-blue-800 grid items-center">
                    <span class="absolute top-0 -mt-4 font-bold left-0 right-0 mx-auto ">Puntaje</span>
                    <span class="text-3xl font-extrabold">{{ score }}</span>
                </div>
                <!-- TIME -->
                <div class="p-2 border-4 border-shine rounded-xl relative w-32 mt-4 text-center bg-gradient-to-r from-blue-600 to-blue-800 grid items-center">
                    <span class="absolute top-0 -mt-4 font-bold left-0 right-0 mx-auto t">Tiempo</span>
                    <span class="text-xl font-bold">{{ time }}</span>
                </div>
            </div>
        </article>
        <!-- CANVAS -->
        <article class="grid justify-center mt-2" :style="{ height: HEIGHT_CANVAS + 'px' }">
            <div class="" >
                <canvas class="border-shine rounded-xl  bg-blue-400" ref="canvas"></canvas>
            </div>
        </article>
        <!-- JOYSTICK -->
        <article v-if="ISMOBILE" id="buttons_movil" class=" flex justify-between items-stretch my-5 gap-4 px-4">
            <div class="h-50 w-50">
                <div class="flex-between">
                    <button  @touchstart="startMovingLeft"  @touchend="stopMovingLeft" class="text-7xl deep-button rotate-90 w-20 h-20 rounded-full border-shine">▼</button>
                    <button  @touchstart="startMovingRight" @touchend="stopMovingRight"  class="text-7xl deep-button rotate-90 ml-[3rem] w-20 h-20 rounded-full border-shine">▲</button>
                </div>
                <div class="grid justify-center -mt-4">
                    <button @touchstart=startMovingDown @touchend=stopMovingDown class="text-7xl deep-button w-20 h-20 rounded-full border-shine">▼ </button>
                </div>
            </div>
            <div class="grid content-between justify-end">
                <button @click="pause" class="w-16 h-6 rounded-xl deep-button border-shine -ml-4" style="font-size: 12px;">PAUSAR</button>
                <div class="ml-12">
                    <button @click="speedDown()" class="rounded-full deep-button w-12 h-12 border-shine grid" style="">
                        <span class="mt-1">▼</span><span class="-mt-4">▼</span>
                    </button>
                </div>
                <button @touchstart="startRotating" @touchend="stopRotating" class="rounded-full deep-button w-16 h-16 border-shine rotate-180 grid -ml-4" style="font-size: 35px;">↻</button>
            </div>
        </article>
    </div>
</template>

<style scoped>




.deep-button {
  background: linear-gradient(145deg,   lightgray, white,white, lightgray);
 
  box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.4), 
              inset 1px 1px 5px rgba(255, 255, 255, 0.7), 
              inset -1px -1px 5px rgba(0, 0, 0, 0.4);
  color: #333;
  cursor: pointer;
  font-size: 16px;
  text-align: center;
  transition: all 0.3s ease;
  user-select: none; /* Evita que el texto del botón se seleccione */
  color: black;
  font-weight: 700;
}

.deep-button:hover {
  box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.4), 
              inset 1px 1px 5px rgba(255, 255, 255, 0.7), 
              inset -1px -1px 5px rgba(0, 0, 0, 0.4);
}

.deep-button-exit {
  background: linear-gradient(145deg, #b62828, #fd0101);
  box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.4), 
              inset 1px 1px 5px rgba(255, 255, 255, 0.7), 
              inset -1px -1px 5px rgba(0, 0, 0, 0.4);
  color: #333;
  cursor: pointer;
  font-size: 16px;
  text-align: center;
  transition: all 0.3s ease;
  user-select: none; /* Evita que el texto del botón se seleccione */
  color: black;
  font-weight: 700;
}

.deep-button:active {
  box-shadow: inset 2px 2px 5px rgba(0, 0, 0, 0.4), 
              inset 1px 1px 5px rgba(255, 255, 255, 0.7);

}

</style>