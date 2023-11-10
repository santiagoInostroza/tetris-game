<script setup>
import MainScreen from './components/MainScreen.vue'
import MenuScreen from './components/MenuScreen.vue'
import GameScreen from './components/GameScreen.vue'
import { ref } from 'vue'

let theme = ref('db')
let showMainScreen = ref(true)
let showMenuScreen = ref(false)
let showGameScreen = ref(false)


const setTheme = (newTheme) => {
    theme.value = newTheme 
    showMainScreen.value = false
    showMenuScreen.value = true
    showGameScreen.value = false
}

const startGame = () => {
    showMainScreen.value = false
    showMenuScreen.value = false
    showGameScreen.value = true
}

const gameOver = () => {
    showMainScreen.value = false
    showMenuScreen.value = true
    showGameScreen.value = false
}


</script>

<template>
  <div class="h-full">

    <section v-if="showMainScreen" id="main_screen">
      <MainScreen @setTheme="setTheme" />
    </section>

    <section v-if="showMenuScreen" id="menu_screen">
      <MenuScreen :theme="theme" @startGame="startGame"/>
    </section>

    <section v-if="showGameScreen" id="game_screen">
      <GameScreen @gameOver="gameOver"/>
    </section>

  </div>
</template>

<style scoped>

</style>

<style>
  
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
        margin-left: 220px;
      }
      50% {
          margin-left: -10px;
      }
      100% {
          margin-left: 220px;
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
