<script setup>
import { defineEmits } from 'vue'
import { DIFFICULTY, difficulty, setDifficulty } from '/src/utils/config.js';

const emit = defineEmits(['menu'])

const menu = () => {
    emit('menu')
}

</script>

<template>
    <div class="h-screen flex flex-col justify-between pb-8">
        <h1 class="shining game_name text-center">TETRIS</h1>
        <div>
            <h2 class="font-bold text-3xl text-gray-300 text-center mb-4 p-4 ">DIFICULTAD</h2>
            <article class="flex gap-4 justify-center items-center p-4 ">
                <button class="backdrop-blur border-shine rounded-xl p-4" :class="difficulty == DIFFICULTY.EASY ? 'selected' : ''" @click="setDifficulty(DIFFICULTY.EASY)">
                    FACIL
                </button>
                <button class="backdrop-blur border-shine rounded-xl p-4" :class="difficulty == DIFFICULTY.MEDIUM ? 'selected' : ''" @click="setDifficulty(DIFFICULTY.MEDIUM)">
                   MODERADO
                </button>
                <button class="backdrop-blur border-shine rounded-xl p-4" :class="difficulty == DIFFICULTY.HARD ? 'selected' : ''" @click="setDifficulty(DIFFICULTY.HARD)">
                   DIFICIL
                </button>
            </article>
        </div>
        <article class="flex gap-4 flex-col items-center justify-center">
            <button @click="menu()
            " class="text-xl md:text-2xl border rounded-2xl p-3 w-72 md:w-[35rem] bg-gradient-to-r from-green-600 to-green-800  border-shine font-extrabold" >MENU</button>
        </article>
    </div>
</template>

<style scoped>
.selected{
    background-color: white;
    color: black;
}
</style>