<script setup>
import MainScreen from './components/MainScreen.vue'
import MenuScreen from './components/MenuScreen.vue'
import GameScreen from './components/GameScreen.vue'
import ConfigScreen from './components/ConfigScreen.vue'
import ScoreScreen from './components/ScoreScreen.vue'
import { ref, onMounted  } from 'vue'
import { setName, hasPlayerName } from './utils/player.js';

let theme = ref('db')
let showMainScreen = ref(false)
let showMenuScreen = ref(true)
let showGameScreen = ref(false)
let showConfigScreen = ref(false)
let showScoreScreen = ref(false)

const currentScreen = ref('menu');
const showNameModal = ref(false);
const tempName = ref('');


const setTheme = (newTheme) => {
    theme.value = newTheme 
    showMainScreen.value = false
    showMenuScreen.value = true
    showGameScreen.value = false
    showConfigScreen.value = false
    showScoreScreen.value = false
}

const startGame = () => {
    currentScreen.value = 'game';
    showMainScreen.value = false
    showMenuScreen.value = false
    showGameScreen.value = true
    showConfigScreen.value = false
    showScoreScreen.value = false
}

const gameOver = () => {
   currentScreen.value = 'menu';
  showMainScreen.value = false
  showMenuScreen.value = true
  showGameScreen.value = false
  showConfigScreen.value = false
  showScoreScreen.value = false
}

const setConfig = () => {
    currentScreen.value = 'config';
    showMainScreen.value = false
    showMenuScreen.value = false
    showGameScreen.value = false
    showConfigScreen.value = true
    showScoreScreen.value = false
}

const menu = () => {
  currentScreen.value = 'menu';
    showMainScreen.value = false
    showMenuScreen.value = true
    showGameScreen.value = false
    showConfigScreen.value = false
    showScoreScreen.value = false
}

const scores = () => {
   currentScreen.value = 'scores';
    showMainScreen.value = false
    showMenuScreen.value = false
    showGameScreen.value = false
    showConfigScreen.value = false
    showScoreScreen.value = true
}

const saveName = () => {
   if (tempName.value.trim()) {
        setName(tempName.value.trim());
        showNameModal.value = false;
    }
}


onMounted(() => {
    // ✅ Verificar si el usuario tiene nombre
    if (!hasPlayerName()) {
        showNameModal.value = true;
    }
});

</script>

<template>
  <div class="h-full  text-white text-border-black	bg">

    <section v-if="showMainScreen" id="main_screen" class="bg ">
      <MainScreen @setTheme="setTheme" />
    </section>

    <section v-if="showMenuScreen" id="menu_screen" class="bg">
      <MenuScreen :theme="theme" @startGame="startGame" @setConfig="setConfig" @scores="scores"/>
    </section>

    <section v-if="showGameScreen" id="game_screen" class="bg_dif">
      <GameScreen @gameOver="gameOver" @menu="menu" />
    </section>

    <!-- CONFIGURACION -->
    <section v-if="showConfigScreen" id="config_screen" class="bg_dif">
      <ConfigScreen @menu="menu"/>
    </section>

    <!-- PUNTAJES -->
    <section v-if="showScoreScreen" id="score_screen" class="bg_dif">
      <ScoreScreen @menu="menu"/>
    </section>

  </div>
</template>

<style scoped>

</style>

<style>
.border-shine{
  border: solid 3px white; /* Crea un borde sólido blanco */
  
  /* Agrega un brillo alrededor del canvas */
  box-shadow: 
    0 0 5px black,
    /* 0 0 10px black, */
    /* 0 0 15px black, */
    /* 0 0 20px black,  */
    /* 0 0 25px black, */
    /* 0 0 30px black, */
    0 0 35px black; 
}
.bg {
    /* The image used */
    background-image: url("/src/assets/img/bg4.png");
    /* difuminado */
    background-color: rgba(0, 0, 0, 0.5);

    /* Full height */
    height: 100%; 

    /* Center and scale the image nicely */
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
}

.bg_dif {
    /* La imagen utilizada */
    background-image: url("/src/assets/img/bg4.png");

    /* Color de fondo con opacidad */
    background-color: rgba(0, 0, 0, 0.5);

    /* Altura completa */
    height: 100%; 

    /* Posicionar y escalar la imagen adecuadamente */
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;

    /* Crear un pseudo-elemento para el efecto de desenfoque */
    position: relative;
    z-index: 1;
}

.bg_dif::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background-image: inherit;
    background-position: inherit;
    background-repeat: inherit;
    background-size: inherit;
    z-index: -1;

    /* Aplicar el filtro de desenfoque */
    filter: blur(8px); /* Ajusta el valor de desenfoque según sea necesario */
}

  
  .text-border-black {
      text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
  }
  
  .game_name{
    font-size: 5.3rem;
    font-weight: 900;
    color: #fff;
    margin: 0;
    text-shadow: 0 0 10px #fff, 0 0 20px #fff, 0 0 30px #fff, 0 0 40px #ff00de, 0 0 70px #ff00de, 0 0 80px #ff00de, 0 0 100px #ff00de, 0 0 150px #ff00de;
  }
  .shining {
    animation: shine 2s linear infinite;
  }

  .moving-text {
    animation: moveText 6s linear infinite;
  }

  @keyframes shine {
    0% {
        opacity: 1;
    }
    50% {
        opacity: 0.1;
    }
    100% {
        opacity: 1;
    }
  }



  @keyframes moveText {
      0% {
        margin-left: 170px;
      }
      50% {
          margin-left: -10px;
      }
      100% {
          margin-left: 170px;
      }
    }
    

  /* media desktop */

  @media (min-width: 768px) {
    .game_name{
      font-size: 10rem;
    }

    @keyframes moveText {
      0% {
        margin-left: 450px;
      }
      50% {
          margin-left: -10px;
      }
      100% {
          margin-left: 450px;
      }
    }
    
  }

</style>
