<script setup>
import { defineEmits } from 'vue'

const emit = defineEmits(['startGame'])

const startGame = () => {
    emit('startGame')
}

</script>
<template>
    <div class="flex flex-col justify-between items-center h-screen pb-8">
        <div class="flex flex-col gap-8 md:gap-4">
            <h1 class="shining game_name text-center">TETRIS</h1>
            <article class="grid justify-center">
                <h2 class="moving-text w-max p-4">Top 3</h2>
                <div class="shadow border p-4 bg-opacity-50 rounded w-72 md:w-[35rem] text-sm">
                    <table class="text-left">
                        <tr>
                            <td class="p-2 py-1 font-bold">Pos.</td>
                            <td class="p-2 py-1 font-bold w-full">Nombre</td>
                            <td class="p-2 py-1 font-bold hidden md:block">Fecha</td>
                            <td class="p-2 py-1 font-bold">País</td>
                            <td class="p-2 py-1 font-bold text-right">Puntaje</td>
                        </tr>
                        <tr v-for="i in 3">
                            <td class="p-2 py-1 ">1</td>
                            <td class="p-2 py-1 w-full">Santiago Inostroza</td>
                            <td class="p-2 py-1 hidden md:block">20/09/2023</td>
                            <td class="p-2 py-1 ">Chile</td>
                            <td class="p-2 py-1 text-right">1000</td>
                        </tr>
                    </table>
                </div>
            </article>
        </div>
        <article class="flex gap-4 flex-col items-center justify-center">
            <button @click="startGame()" class="text-xl md:text-3xl font-bold border rounded p-4 w-72 md:w-[35rem]  bg-green-500">JUGAR</button>
            <div class="flex gap-4 flex-col md:flex-row">
              <button class="text-xl md:text-2xl font-bold border rounded p-4 w-72 md:w-[17rem] ">CONFIGURACIÓN</button>
              <button class="text-xl md:text-2xl font-bold border rounded p-4 w-72 md:w-[17rem] ">PUNTAJES</button>
            </div>
        </article>
    </div>
</template>

<style>
</style>