<script setup>
import { defineEmits, onMounted, ref } from 'vue'
import { fetchPlayers } from '/src/api/apiScore.js';
import { ISMOBILE } from '/src/utils/consts.js';

const emit = defineEmits(['startGame', 'setConfig', 'scores'])

const startGame = () => {
    emit('startGame')
}

const setConfig = () => {
    emit('setConfig')
}

const scores = () => {
    emit('scores')
}


const players = ref([]);

const loadPlayers = async () => {
    try {
        const response = await fetchPlayers();
        players.value = response.data;

    } catch (error) {
        console.error("Error al cargar los puntajes:", error);
        // Manejar el error adecuadamente, por ejemplo, mostrar un mensaje al usuario
    }
};

onMounted(() => {
    loadPlayers(); 
});


</script>
<template>
    <div class="flex flex-col gap-12 md:gap-8 justify-between items-center pb-28 md:pb-14" :style="{'height': ISMOBILE ? 'calc(100vh - 50px)' : '100vh'}">
        <article class="flex flex-col gap-8 md:gap-2">
            <h1 class="shining game_name text-center">TETRIS</h1>
            <article class="grid justify-center ">
                <h2 class="moving-text w-max p-4 text-3xl font-extrabold">Top 5</h2>
                <div class="shadow border p-4 rounded-xl w-72 md:w-[35rem] text-sm bg-gradient-to-r from-blue-600 to-blue-800 border-shine">
                    <table class="text-left">
                        <tr>
                            <td class="p-2 py-1 font-bold">Pos.</td>
                            <td class="p-2 py-1 font-bold w-full">Nombre</td>
                            <td class="p-2 py-1 font-bold w-32 hidden md:block">Fecha</td>
                            <td class="p-2 py-1 font-bold w-24">País</td>
                            <td class="p-2 py-1 font-bold text-right">Puntaje</td>
                        </tr>
                        <tr v-for="(player, index) in players" :key="player.id">
                            <td class="p-2 py-1">{{ index + 1 }}</td>
                            <td class="p-2 py-1">{{ player.name }}</td>
                            <td class="p-2 py-1 hidden md:block">{{ player.date }}</td>
                            <td class="p-2 py-1">{{ player.country }}</td>
                            <td class="p-2 py-1 text-right">{{ player.score }}</td>
                        </tr>
                    </table>
                </div>
            </article>
        </article>
        <article class="flex gap-4 flex-col items-center justify-center">
            <button @click="startGame()" class="text-xl md:text-2xl border rounded-2xl p-3 w-72 md:w-[35rem] bg-gradient-to-r from-green-600 to-green-800  border-shine font-extrabold" >JUGAR</button>
            <div class="flex gap-4 flex-col md:flex-row">
              <button @click="setConfig" class="text-xl md:text-2xl border rounded-2xl p-3 w-72 md:w-[17rem] bg-gradient-to-r from-blue-600 to-blue-800 border-shine font-extrabold">CONFIGURACIÓN</button>
              <button @click="scores" class="text-xl md:text-2xl border rounded-2xl p-3 w-72 md:w-[17rem] bg-gradient-to-r from-blue-600 to-blue-800 border-shine font-extrabold">PUNTAJES</button>
            </div>
        </article>
    </div>
</template>

<style>
</style>