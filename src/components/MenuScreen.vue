<script setup>
import { defineEmits } from 'vue'

const emit = defineEmits(['startGame'])

const startGame = () => {
    emit('startGame')
}

</script>
<template>
    <div class="flex flex-col justify-between items-center h-screen pb-20">
        <div class="flex flex-col gap-8 md:gap-4">
            <h1 class="shining game_name text-center">TETRIS</h1>
            <article class="grid justify-center ">
                <h2 class="moving-text w-max p-4 text-3xl font-extrabold">Top 3</h2>
                <div class="shadow border p-4 rounded-xl w-72 md:w-[35rem] text-sm bg-gradient-to-r from-blue-600 to-blue-800 border-shine">
                    <table class="text-left">
                        <tr>
                            <td class="p-2 py-1 font-bold">Pos.</td>
                            <td class="p-2 py-1 font-bold w-full">Nombre</td>
                            <td class="p-2 py-1 font-bold hidden md:block">Fecha</td>
                            <td class="p-2 py-1 font-bold">País</td>
                            <td class="p-2 py-1 font-bold text-right">Puntaje</td>
                        </tr>
                        <tr v-for="i in 3">
                            <td class="p-2 py-1 ">{{ i }}</td>
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
            <button @click="startGame()" class="text-xl md:text-2xl border rounded-2xl p-3 w-72 md:w-[35rem] bg-gradient-to-r from-green-600 to-green-800  border-shine font-extrabold" >JUGAR</button>
            <div class="flex gap-4 flex-col md:flex-row">
              <button class="text-xl md:text-2xl border rounded-2xl p-4 w-72 md:w-[17rem] bg-gradient-to-r from-blue-600 to-blue-800 border-shine font-extrabold">CONFIGURACIÓN</button>
              <button class="text-xl md:text-2xl border rounded-2xl p-4 w-72 md:w-[17rem] bg-gradient-to-r from-blue-600 to-blue-800 border-shine font-extrabold">PUNTAJES</button>
            </div>
        </article>
    </div>
</template>

<style>
</style>