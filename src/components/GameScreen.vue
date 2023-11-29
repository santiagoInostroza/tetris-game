<script setup>

// IMPORTS
    import {
        ISMOBILE, HEIGHT_CANVAS, BLOCK_SIZE, BOARD_WIDTH, BOARD_HEIGHT, DIRECTIONS
    } from '/src/utils/consts.js';

    import { 
        ref, onMounted, onBeforeUnmount, reactive, defineEmits, watch
    } from 'vue';

    import { PIECES, COLORS } from '/src/utils/pieces.js';

    import { difficulty, DIFFICULTY } from '/src/utils/config.js';

    import { 
        formatTime, createBoard, getNewPiece, checkCollision 
    } from '/src/utils/helpers.js';

    import { 
        handleKeyDown, handleKeyUp, movePiece, continueMovement
    } from '/src/utils/keyboardControls.js';

    import { 
        drawSquare, showScoreOnCompletedLines, bonus, drawSquareWithBonus,
    } from '/src/utils/draw.js';

    import { createPlayer } from '/src/api/apiPlayer.js';

    import {
        startRemoveLineOneSound, startRemoveLineTwoSound, startRemoveLineThreeSound, startRemoveLineFourSound, startRemoveLineFiveSound,
        startGameAudio,stopGameAudio , pauseGameAudio, startBonusSound, stopBonusSound, pauseBonusSound, setMusicVolume, setSoundVolume
        // startRotateSound, 
       
        // startDropSound
    } from '/src/utils/sounds.js';

    import SwitchButton from './/components/SwitchButton.vue';

    
    import { name } from '/src/utils/player.js';



    
    
    
    // CONSTANTS    
    const player = ref(null);
    const hasName = ref(false);
    
    const emit = defineEmits(['gameOver', 'menu']);

    const menu = () => {
        emit('menu')
    }

    const pieces = ref(PIECES[difficulty.value]);


    const canvas  = ref(null);
    const context = ref(null);

    const score = ref(0);
    const newScore = ref(0);
    const time = ref('00:00:00')

    const board = createBoard(BOARD_WIDTH, BOARD_HEIGHT);
    const isPaused = ref(true);
    const isGameOver = ref(false);

    const piece = reactive({
        position: { x: 5, y: 5 },
        matrix: {},
    });

// VARIABLES
    let dropCounter = 0;
    let animationFrameId;
    
    let activeGameTime = 0; // Tiempo total de juego activo
    let lastUpdateTime = 0; // Última vez que se actualizó el juego

    let shouldShowScore = false;
    let linePosition = -10;

    let isGameSound = false;
    let isBonusSound = false;
    let soundPaused = null;


    const keyDownHandler = (event) => handleKeyDown(event, board, piece, { solidifyPiece, removeLines, updateDropCounter });  

    onMounted(() => {
        canvas.value.width = BLOCK_SIZE * BOARD_WIDTH;
        canvas.value.height = BLOCK_SIZE * BOARD_HEIGHT;
        context.value = canvas.value.getContext('2d');
        context.value.scale(BLOCK_SIZE, BLOCK_SIZE);
        [piece.matrix, piece.color] = getNewPiece(pieces.value, COLORS);
        if (name){
            player.value = name;
            hasName.value = true;   
        }
        // piece.position = {x: 0 , y: 0}
        piece.matrix = [
            [1],
        ]
        piece.color = 'ghost';
        startGame();
        
        
        // window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keydown', keyDownHandler);
        window.addEventListener('keyup', handleKeyUp);

        window.onbeforeunload = function() {
            return '¿Estás seguro de que deseas abandonar esta página?';
        };

        window.addEventListener('blur', function() {
            pause();
        });

        history.pushState(null, null, document.URL);
            window.addEventListener('popstate', function () {
            history.pushState(null, null, document.URL);
        });

       
    });

    onBeforeUnmount(() => {
        window.cancelAnimationFrame(animationFrameId);

        window.removeEventListener('keydown', keyDownHandler);
        window.removeEventListener('keyup', handleKeyUp);

        window.onbeforeunload = null; // Elimina el manejador de beforeunload
        window.removeEventListener('blur', () => {
            pause();
        });
        window.removeEventListener('popstate', () => {
            history.pushState(null, null, document.URL);
        });
    });

    // FUNCIONES    

    const getTwoPieces = () => {
        return  pieces.value[Math.floor(Math.random() * pieces.value.length)]
        // return pieces.value[4]
    }

    const updateDropCounter = () => {
        dropCounter = 0;
    };

    const startGame = () => {
        // Inicia el loop del juego
        isPaused.value = false;
        isGameOver.value = false;
        animationFrameId = window.requestAnimationFrame(update);
        // Añadir otros inicializadores aquí si es necesario
        startGameAudio();
        isGameSound = true;
        rowsWithBonus = [];
    }


    const restartGame = () => {
        // Restablecer puntuación y estados relacionados con el juego
        score.value = 0;
        newScore.value = 0;
        activeGameTime = 0;
        lastUpdateTime = 0;
        dropCounter = 0;
        shouldShowScore = false;
        linePosition = 0;
        rowsWithBonus = [];
        // Restablecer el tablero a su estado inicial
        board.splice(0, board.length, ...createBoard(BOARD_WIDTH, BOARD_HEIGHT));

        // Restablecer la pieza actual
        [piece.matrix, piece.color] = getNewPiece(pieces.value, COLORS);
        piece.position.x = Math.floor((BOARD_WIDTH - piece.matrix[0].length) / 2);
        piece.position.y = 0;

        // Reiniciar el estado de pausa y finalización del juego
        isPaused.value = false;
        isGameOver.value = false;

        // Iniciar el ciclo de animación del juego
        animationFrameId = window.requestAnimationFrame(update);
        startGameAudio();
        
        isGameSound = true;
    };


    const gameOver = () => {
        isGameOver.value = true;
        pause();
        stopGameAudio();
        if (hasName.value && score.value > 0) {
            submitPlayerScore();
        }
    }

    const submitPlayerScore = async () => {

        if(!player.value){
            return;
        }
        hasName.value = true;
        try {
            let newPlayer = { 
                name: player.value,
                score: score.value,
                time: time.value,
                difficulty: difficulty.value,
            }
            const response = await createPlayer(newPlayer);
        } catch (error) {
            console.error("Error al agregar el puntaje:", error);
            // Manejar el error adecuadamente, por ejemplo, mostrar un mensaje al usuario
        }
    };

    const update = (timestamp) => {

        continueMovement(board, piece, movementStates, isTouching, { solidifyPiece, removeLines, updateDropCounter } );
        


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
                movePiece( board, piece, 'down', { solidifyPiece, removeLines });
                dropCounter = 0;
            }
            draw(deltaTime);

        }

        lastUpdateTime = timestamp;

        if (!isGameOver.value) {
            animationFrameId = window.requestAnimationFrame(update);
        }
    };


  
    let showBonus = false;
    let timeBonus = 0;
    let textBonus = '';
    let multiplierBonus = 1;
    let remainingBonusTime = 0;

    const piecesImages = {};
    piecesImages.ghost =new Image();
    piecesImages.ghost.src = '/src/assets/img/pieces/ghost.png'; 


    const draw = (deltaTime) => {
        // Dibuja el fondo del juego
        context.value.fillStyle = 'black';
        context.value.fillRect(0, 0, canvas.value.width, canvas.value.height);      
        
        
        // Dibuja el tablero y las piezas solidificadas
        board.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell.value > 0) {
                    drawSquare(context.value, x, y, cell.color, 'gray', 0.05, 'black');
                    if(cell.bonus > 0){
                        let text = 'X' + cell.bonus;
                        drawSquareWithBonus(context.value, x, y, text)
                    }
                    if (cell.color === 'ghost') {
                        context.value.drawImage(piecesImages.ghost, x, y, 1, 1);
                    }
                }
            });
        });
        
        
        // Dibuja la pieza actual
        piece.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    drawSquare(context.value, piece.position.x + x, piece.position.y + y, piece.color, piece.color , 0.06, 'black', showBonus, piecesImages);
                }
            });
        });

      

        if(shouldShowScore){
            showScoreOnCompletedLines( context.value, newScore.value, linePosition)
        } 

        if (showBonus) {
            remainingBonusTime = remainingBonusTime - deltaTime;
            bonus(context.value, textBonus,remainingBonusTime, timeBonus);
        }
    };   

    const pause = () => {
        window.cancelAnimationFrame(animationFrameId);
        isPaused.value = true;
        if (isGameSound) {
            pauseGameAudio();
            soundPaused = 'game';
            isGameSound = false;
        }
        if (isBonusSound) {
            pauseBonusSound();
            soundPaused = 'bonus';
            isBonusSound = false;
        }
    };
    
    const togglePause = () => {
        if (!isPaused.value) {
            pause();
        } else {
            lastUpdateTime = performance.now();
            animationFrameId = window.requestAnimationFrame(update);
            isPaused.value = false;
            if (soundPaused === 'game') {
                startGameAudio();
                isGameSound = true;
            }
            if (soundPaused === 'bonus') {
                startBonusSound();
                isBonusSound = true;
            }
            isGameSound = true;
        }
    };

    let musicVolume = 1;

   

    const musicOff = () => {
        musicVolume = 0;
        setMusicVolume(musicVolume);
    }

    const musicOn = () => {
        musicVolume = 1;
        setMusicVolume(musicVolume);
    }

    let soundVolume = 1;

    const soundOff = () => {
        soundVolume = 0;
        setSoundVolume(soundVolume);
    }

    const soundOn = () => {
        soundVolume = 1;
        setSoundVolume(soundVolume);
    }
   
    let rowsWithBonus = [];

    const solidifyPiece = () => {
        console.log('rowsWithBonus', rowsWithBonus);
        piece.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    let bonus = 0;
                    if(!rowsWithBonus.includes(piece.position.y+ y)){
                        let random = (Math.random() * 100)
                        bonus = (random < 8.2) ? 10 : 0;
                        bonus = (random < 8) ? 5 : bonus;
                        bonus = (random < 7) ? 4 : bonus;
                        bonus = (random < 5.5) ? 3 : bonus;
                        bonus = (random < 3.5) ? 2 : bonus;
                        if (bonus > 0) {
                            rowsWithBonus.push(piece.position.y+ y);
                        }
                    }
                    board[piece.position.y + y][piece.position.x + x] = { value, color: piece.color, bonus: bonus };
                }
            });
        });
        [piece.matrix, piece.color] = getNewPiece(pieces.value, COLORS);
        piece.position.y = 0;
        piece.position.x = Math.floor((BOARD_WIDTH - piece.matrix[0].length) / 2);
        if (checkCollision(board, piece)) {
            gameOver();
        }
    };



    let countBonus = 0;
    const removeLines = () => {
        let lines = 0;
        let linePositions = []; // Almacenará las posiciones de las líneas a eliminar
        // Identificar todas las líneas completas
        let newBonus = 0;
        board.forEach((row, y) => {
            if (row.every((cell) => cell.value > 0)) {
                lines++;
                linePositions.push(y);linePosition = y;
                rowsWithBonus = rowsWithBonus.filter((row) => row !== y);
           }

            if (row.every((cell) => cell.value > 0) && row.some((cell) => cell.bonus > 0)) {
            row.forEach((cell) => {
                if (cell.bonus > 0) {
                    countBonus += cell.bonus;
                    newBonus++;
                }
            });
}
        });

        shouldShowScore = true;

        // Función para eliminar una línea y actualizar la puntuación
        const removeLine = (lineIndex) => {
            if (lineIndex < linePositions.length) {
                const y = linePositions[lineIndex];
                
                board.splice(y, 1);
                board.unshift(Array(BOARD_WIDTH).fill(0));

                newScore.value = ((lineIndex + 1 ) * BOARD_WIDTH) * (1 + ((lineIndex) * 0.25) ) * multiplierBonus;
                if (lineIndex === 0) {
                    startRemoveLineOneSound();
                } else if (lineIndex === 1) {
                    startRemoveLineTwoSound();
                } else if (lineIndex === 2) {
                    startRemoveLineThreeSound();
                } else if (lineIndex === 3) {
                    startRemoveLineFourSound();
                } else if (lineIndex === 4) {
                    startRemoveLineFiveSound();
                    startBonus('45', 'X3', 3);
                }
                
                if (lineIndex === linePositions.length - 1) { 
                    score.value += newScore.value;
                    if (newBonus > 0) {
                        startBonus('40', 'X' + countBonus , countBonus);
                    }

                    setTimeout(() => {
                        shouldShowScore = false;
                        linePosition = -10;
                    }, 1000);
                }

                // Llamar a la función de nuevo después de 0.400 segundos para la siguiente línea
                setTimeout(() => removeLine(lineIndex + 1), 400);
            }
        };

        // Iniciar la eliminación de líneas
        removeLine(0);
    };

    let countSetTimeout = 0;
    function startBonus(time = 20, text = 'X2', multiplier = 2 ){
        countSetTimeout++;

        textBonus = text;
        multiplierBonus = multiplier;
        showBonus = true;
        timeBonus = remainingBonusTime = time * 1000;
        pauseGameAudio();
        isGameSound = false;
        startBonusSound();
        isBonusSound = true;
        setTimeout(() => {
            countSetTimeout--;
           if(countSetTimeout === 0){
                startGameAudio();
                isGameSound = true;
                stopBonusSound();
                isBonusSound = false;
                showBonus = false;
                textBonus = '';
                multiplierBonus = 1;
                countBonus = 0;
            }
         }, timeBonus);
    }
    
    const isMusicOn = ref(true);
    const isSoundsOn = ref(true);

    watch(isMusicOn, (newValue) => {
      if (newValue) {
        musicOn();
      } else {
        musicOff();
      }
    });

    watch(isSoundsOn, (newValue) => {
      if (newValue) {
        soundOn();
      } else {
        soundOff();
      }
    });

    let movementStates = {
        isMovingleft: false,
        isMovingright: false,
        isMovingdown: false,
        isMovingrotate: false,
        isMovingspace: false,
    };

    let isTouching = false;

    function startMovement(direction) {
        movementStates[`isMoving${direction}`] = true;
        isTouching = true;
    }

    function stopMovement(direction) {
        movementStates[`isMoving${direction}`] = false;
        isTouching = Object.values(movementStates).some(value => value);
    }


   


</script>

<template>
    <!-- CONTENEDOR PRINCIPAL -->
    <div class="grid justify-center">

        <!-- SCORE AND TIME -->
        <article v-if="ISMOBILE" class="shadow rounded py-2">
            <div class="flex justify-between w-screen px-4">
                <!-- SCORE-->
                <div class="p-1 border-4 border-shine rounded-xl relative w-32 mt-4 text-center bg-gradient-to-r from-blue-600 to-blue-800 grid items-center">
                    <span class="absolute top-0 -mt-4 font-bold left-0 right-0 mx-auto select-none">Puntaje</span>
                    <span class="text-3xl font-extrabold">{{ score }}</span>
                </div>
                <!-- TIME -->
                <div class="p-2 border-4 border-shine rounded-xl relative w-32 mt-4 text-center bg-gradient-to-r from-blue-600 to-blue-800 grid items-center">
                    <span class="absolute top-0 -mt-4 font-bold left-0 right-0 mx-auto select-none">Tiempo</span>
                    <span class="text-xl font-bold">{{ time }}</span>
                </div>
            </div>
        </article>        

        <div class="flex gap-4">
            <div v-if="!ISMOBILE">
                <!-- SCORE-->
                <div class="p-1 border-4 border-shine rounded-xl relative w-32 mt-4 text-center bg-gradient-to-r from-blue-600 to-blue-800 grid items-center">
                    <span class="absolute top-0 -mt-4 font-bold left-0 right-0 mx-auto ">Puntaje</span>
                    <span class="text-3xl font-extrabold">{{ score }}</span>
                </div>
            </div> 
            <!-- CANVAS -->
            <article class="grid justify-center mt-2 w-full" :style="{ height: HEIGHT_CANVAS + 'px' }">
                <div class="" >
                    <canvas class="border-shine rounded-xl  bg-blue-400" ref="canvas"></canvas>
                </div>
            </article>
            <div v-if="!ISMOBILE">
                <!-- TIME -->
                <div class="grid gap-4">
                    <div class="p-2 border-4 border-shine rounded-xl relative w-32 mt-4 text-center bg-gradient-to-r from-blue-600 to-blue-800 grid items-center">
                        <span class="absolute top-0 -mt-4 font-bold left-0 right-0 mx-auto t">Tiempo</span>
                        <span class="text-xl font-bold">{{ time }}</span>
                    </div>
                    <button @click="togglePause" class="w-32 p-2 rounded-xl deep-button border-shine" style="font-size: 12px;">OPCIONES</button>
                </div>
            </div>
        </div>
        <!-- JOYSTICK -->
        <article v-if="ISMOBILE" id="buttons_movil" class=" flex justify-between items-stretch my-5 gap-4 px-4 select-none">
            <div class="h-50 w-50">
                <div class="flex-between">
                    <button  @touchstart="startMovement(DIRECTIONS.LEFT)"  @touchend="stopMovement(DIRECTIONS.LEFT)" class="text-7xl deep-button rotate-90 w-20 h-20 rounded-full border-shine">▼</button>
                    <button  @touchstart="startMovement(DIRECTIONS.RIGHT)" @touchend="stopMovement(DIRECTIONS.RIGHT)"  class="text-7xl deep-button rotate-90 ml-[3rem] w-20 h-20 rounded-full border-shine">▲</button>
                </div>
                <div class="grid justify-center -mt-4">
                    <button @touchstart="startMovement(DIRECTIONS.DOWN)" @touchend="stopMovement(DIRECTIONS.DOWN)" class="text-7xl deep-button w-20 h-20 rounded-full border-shine">▼ </button>
                </div>
            </div>
            <div class="grid content-between justify-end">
                <button @click="togglePause" class="w-16 h-6 rounded-xl deep-button border-shine -ml-4" style="font-size: 12px;">OPCIONES</button>
                <div class="ml-12">
                    <button @touchstart="startMovement('space')" @touchend="stopMovement('space')" class="rounded-full deep-button w-12 h-12 border-shine grid" style="">
                        <span class="mt-1">▼</span><span class="-mt-4">▼</span>
                    </button>
                </div>
                <button @touchstart="startMovement(DIRECTIONS.ROTATE)" @touchend="stopMovement(DIRECTIONS.ROTATE)" class="rounded-full deep-button w-16 h-16 border-shine rotate-180 grid -ml-4" style="font-size: 35px;">↻</button>
            </div>
        </article>            
        
    </div>

    <!-- MODALES -->
    <div>
        <!-- MODAL PAUSA-->
        <article v-if="isPaused && !isGameOver">
            <div class="w-screen h-screen absolute bg-gray-800 opacity-90 z-10 left-0 top-0 ">
            </div>
            <div class="absolute left-0 top-0 h-full w-full z-10 grid items-center justify-center">
                <!-- titulo opciones -->
                <h2 class="font-bold text-3xl text-gray-300 text-center mb-4 p-4 ">OPCIONES</h2>
                
                <div class="grid gap-6 shadow border p-4 rounded-xl text-sm bg-gradient-to-r from-gray-400 to-gray-500 border-shine">
                    <div class="grid grid-cols-2 gap-4 items-center text-xl">
                        <p class=" font-bold uppercase">Dificultad</p>
                        <div class="text-right ">
                            <p v-if="difficulty == DIFFICULTY.EASY" >FACIL</p>
                            <p v-if="difficulty == DIFFICULTY.MEDIUM">MEDIA</p>
                            <p v-if="difficulty == DIFFICULTY.HARD">DIFICIL</p>
                        </div>
                    </div>
                      <!-- music on off -->
                    <div class="flex items-center justify-between gap-4 text-xl">
                        <p class="text-center font-bold uppercase">MUSICA</p>
                        <SwitchButton v-model="isMusicOn" class=" p-2 rounded-xl border-shine flex gap-4 items-center justify-between" :class="{'bg-green-500': isMusicOn, 'bg-red-500':!isMusicOn}"/>
                    </div>
                    <div class="flex items-center justify-between gap-4 text-xl">
                        <p class="text-center font-bold uppercase">SONIDOS</p>
                        <SwitchButton v-model="isSoundsOn" class=" p-2 rounded-xl border-shine flex gap-4 items-center justify-between" :class="{'bg-green-500': isSoundsOn, 'bg-red-500':!isSoundsOn}"/>
                    </div>
                    
                </div>
                

                <article class="flex gap-4 flex-col items-center justify-center">
                    <div class="flex gap-4 flex-col md:flex-row">
                        <button @click="togglePause" class="text-xl md:text-2xl border rounded-2xl p-4 w-72 md:w-[17rem] bg-gradient-to-r from-green-600 to-green-800  border-shine font-extrabold" >CONTINUAR</button>
                        <button @click="menu" class="text-xl md:text-2xl border rounded-2xl p-4 w-72 md:w-[17rem] bg-gradient-to-r from-red-600 to-red-800 border-shine font-extrabold">SALIR</button>
                    </div>
                </article>



            </div>
        </article>

        <!--MODAL GAME OVER -->
        <article v-if="isGameOver">
            <div class="w-screen h-screen absolute bg-gray-800 opacity-90 z-10 left-0 top-0 ">
            </div>
            <div class="absolute left-0 top-0 h-full w-full z-10 grid items-center justify-center">
                <!-- titulo opciones -->
                <h2 class="font-bold text-3xl text-gray-300 text-center mb-4 p-4 ">GAME OVER</h2>
                
                <div class="grid gap-8 shadow border p-4 py-8 rounded-xl text-sm bg-gradient-to-r from-blue-600 to-blue-800 border-shine">
                    <div class="grid justify-center gap-4 items-center text-xl">
                        <p class="text-center font-bold uppercase">Puntaje</p>
                        <div class="text-center font-bold text-5xl">
                            <p>{{ score }}</p>
                        </div>
                    </div>
                    <!-- NOMBRE -->
                    <div  v-if="!hasName"  class="grid justify-center gap-4 items-center text-xl">
                        <p class="font-bold uppercase text-center">Ingresa tu Nombre</p>
                        <div class="text-center ">
                            <input v-model="player" class="text-center text-orange-500 border-2 border-shine rounded-xl w-72 bg-gradient-to-r from-yellow-100 to-orange-100 border-shine font-extrabold p-2" type="text" placeholder="Ingresa Nombre">
                        </div>
                        <div class="flex justify-center gap-4 mt-4">
                            <button @click="submitPlayerScore" class="text-xl md:text-2xl border rounded-2xl p-3 w-72 md:w-[17rem] bg-gradient-to-r from-green-600 to-green-800  border-shine font-extrabold" >OK</button>
                        </div>
                    </div>
                    <div  v-else class="grid justify-center gap-4 items-center text-xl">
                        <p class="font-bold uppercase text-center">Nombre</p>
                        <div class="p-4 text-5xl text-center font-bold">
                            {{ player }}
                        </div>
                    </div>
                </div>

                <article v-if="hasName" class="flex gap-4 flex-col items-center justify-center">
                    <button @click="menu" class="text-xl md:text-2xl border rounded-2xl p-3 w-72 md:w-[35rem] bg-gradient-to-r from-red-600 to-red-800 border-shine font-extrabold" >IR AL MENU</button>
                    <button @click="restartGame" class="text-xl md:text-2xl border rounded-2xl p-3 w-72 md:w-[35rem] bg-gradient-to-r from-green-600 to-green-800  border-shine font-extrabold" >VOLVER A JUGAR</button>
                </article>

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