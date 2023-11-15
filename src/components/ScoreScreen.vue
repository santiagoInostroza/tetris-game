<script setup>
import { defineEmits, onMounted, ref } from 'vue'
import { fetchPlayers } from '/src/api/apiScore.js';
import { DIFFICULTY } from '/src/utils/config.js';

const emit = defineEmits(['menu'])

const menu = () => {
    emit('menu')
}

const easyPlayers = ref([]);
const mediumPlayers = ref([]);
const hardPlayers = ref([]);

const loadPlayers = async () => {
    try {
        const response = await fetchPlayers();
        return response.data;

    } catch (error) {
        console.error("Error al cargar los puntajes:", error);
        // Manejar el error adecuadamente, por ejemplo, mostrar un mensaje al usuario
    }
};

const loadDifficultyEasy = async () => {
        const response = await fetchPlayers(10, DIFFICULTY.EASY);
        easyPlayers.value = response.data;
};

const loadDifficultyMedium = async () => {
        const response = await fetchPlayers(10, DIFFICULTY.MEDIUM);
        mediumPlayers.value = response.data;
};

const loadDifficultyHard = async () => {
        const response = await fetchPlayers(10, DIFFICULTY.HARD);
        hardPlayers.value = response.data;
};

onMounted(() => {
    loadDifficultyEasy(); // Llama a la función para cargar los puntajes
    loadDifficultyMedium(); // Llama a la función para cargar los puntajes
    loadDifficultyHard(); // Llama a la función para cargar los puntajes
});


</script>

<template>
    <div class="flex flex-col gap-12 md:gap-8 justify-between items-center h-screen pb-28 md:pb-14">
        <h1 class="text-center text-5xl font-bold">PUNTAJES</h1>
        <section class="flex flex-col gap-8 md:gap-2 overflow-auto border shadow-xl p-4 rounded-xl" style="height: calc(100% - 8rem);">
            <article class="grid justify-center ">
                <h2 class="w-max p-4 text-3xl font-extrabold">DIFICIL</h2>
                <div class="shadow border p-4 rounded-xl w-72 md:w-[35rem] text-sm bg-gradient-to-r from-blue-600 to-blue-800 border-shine">
                    <table class="text-left">
                        <tr>
                            <td class="p-2 py-1 font-bold">Pos.</td>
                            <td class="p-2 py-1 font-bold w-full">Nombre</td>
                            <td class="p-2 py-1 font-bold w-32 hidden md:block">Fecha</td>
                            <td class="p-2 py-1 font-bold w-24">País</td>
                            <td class="p-2 py-1 font-bold text-right">Puntaje</td>
                        </tr>
                        <tr v-for="(player, index) in hardPlayers" :key="player.id">
                            <td class="p-2 py-1">{{ index + 1 }}</td>
                            <td class="p-2 py-1">{{ player.name }}</td>
                            <td class="p-2 py-1 hidden md:block">{{ player.date }}</td>
                            <td class="p-2 py-1">{{ player.country }}</td>
                            <td class="p-2 py-1 text-right">{{ player.score }}</td>
                        </tr>
                    </table>
                </div>
            </article>
            <article class="grid justify-center ">
                <h2 class="w-max p-4 text-3xl font-extrabold">MODERADO</h2>
                <div class="shadow border p-4 rounded-xl w-72 md:w-[35rem] text-sm bg-gradient-to-r from-blue-600 to-blue-800 border-shine">
                    <table class="text-left">
                        <tr>
                            <td class="p-2 py-1 font-bold">Pos.</td>
                            <td class="p-2 py-1 font-bold w-full">Nombre</td>
                            <td class="p-2 py-1 font-bold w-32 hidden md:block">Fecha</td>
                            <td class="p-2 py-1 font-bold w-24">País</td>
                            <td class="p-2 py-1 font-bold text-right">Puntaje</td>
                        </tr>
                        <tr v-for="(player, index) in mediumPlayers" :key="player.id">
                            <td class="p-2 py-1">{{ index + 1 }}</td>
                            <td class="p-2 py-1">{{ player.name }}</td>
                            <td class="p-2 py-1 hidden md:block">{{ player.date }}</td>
                            <td class="p-2 py-1">{{ player.country }}</td>
                            <td class="p-2 py-1 text-right">{{ player.score }}</td>
                        </tr>
                    </table>
                </div>
            </article>
            <article class="grid justify-center ">
                <h2 class="w-max p-4 text-3xl font-extrabold">FACIL</h2>
                <div class="shadow border p-4 rounded-xl w-72 md:w-[35rem] text-sm bg-gradient-to-r from-blue-600 to-blue-800 border-shine">
                    <table class="text-left">
                        <tr>
                            <td class="p-2 py-1 font-bold">Pos.</td>
                            <td class="p-2 py-1 font-bold w-full">Nombre</td>
                            <td class="p-2 py-1 font-bold w-32 hidden md:block">Fecha</td>
                            <td class="p-2 py-1 font-bold w-24">País</td>
                            <td class="p-2 py-1 font-bold text-right">Puntaje</td>
                        </tr>
                        <tr v-for="(player, index) in easyPlayers" :key="player.id">
                            <td class="p-2 py-1">{{ index + 1 }}</td>
                            <td class="p-2 py-1">{{ player.name }}</td>
                            <td class="p-2 py-1 hidden md:block">{{ player.date }}</td>
                            <td class="p-2 py-1">{{ player.country }}</td>
                            <td class="p-2 py-1 text-right">{{ player.score }}</td>
                        </tr>
                    </table>
                </div>
            </article>
        </section>
        <section class="flex gap-4 flex-col items-center justify-center">
            <button @click="menu()
            " class="text-xl md:text-2xl border rounded-2xl p-3 w-72 md:w-[35rem] bg-gradient-to-r from-green-600 to-green-800  border-shine font-extrabold" >MENU</button>
        </section>
    </div>
</template>

<style scoped>
.selected{
    background-color: white;
    color: black;
}
</style>