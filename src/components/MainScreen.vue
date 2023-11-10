<script setup>
import { defineEmits } from 'vue'

const emit = defineEmits(['setTheme'])

const setTheme = (theme) => {
    emit('setTheme', theme)
}


</script>
<template>
    <div class="h-screen flex flex-col justify-between pb-8">
        <h1 class="shining game_name text-center">TETRIS</h1>
        <div>
            <h2 class="font-bold text-3xl text-gray-300 text-center mb-4 p-4">Selecciona Tu Favorito</h2>
            <article class="flex gap-4 justify-center items-center p-4 flex-wrap">
                <button class="" data-theme="db" @click="setTheme('db')">
                    <img src="src/assets/img/logo_db.png" alt="logo Dragon Ball" class=" w-[17rem] h-48 border p-4 rounded shadow" />
                </button>
                <button class="" data-theme="sm" @click="setTheme('sm')">
                    <img src="src/assets/img/logo_sm.png" alt="logo Sailor Moon" class=" w-[17rem] h-48 border p-4 rounded shadow" />
                </button>
            </article>
        </div>
    </div>
</template>
<style>




</style>