import axios from 'axios';
import { DIFFICULTY } from '/src/utils/config.js';
import {ISPRODUCTION } from '/src/utils/consts.js';
import { playerID, setName } from '/src/utils/player.js';

const API_URL_LOCAL = 'http://localhost/api/';
const API_URL_PRODUCCION = 'https://tetrisbackend.saig.cl/api/';
let url = null;
let api_url = null;

let  player;

if(ISPRODUCTION){
    api_url = API_URL_PRODUCCION;
}
else{
    // api_url = API_URL_LOCAL;
    api_url = API_URL_PRODUCCION;
}

const API_KEY_IPGEOLOCATION = "33ce76efdd2c425fba086db0e27acc5e";
const URL_IPGEOLOCATION = "https://api.ipgeolocation.io/ipgeo?apiKey=" + API_KEY_IPGEOLOCATION;




// GET /players
export async function fetchPlayers(quantity = 5, difficulty = DIFFICULTY.MEDIUM) {
   
    let url = `${api_url}players`;
  try {
        return await axios.get(url, {
            params: {
                quantity,
                difficulty,
            }
        });
    } catch (error) {
        console.error(error);
    }
}

// GET /players/:id
export async function fetchPlayer(player_id) {
    let url = `${api_url}players/${player_id}`;
    try {
        const response = await axios.get(url);
        return response.data; // Retorna los datos del jugador
    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.error('Jugador no encontrado:', error.response.data.message);
        } else {
            console.error('Error en la solicitud:', error.message);
        }
        return null;
    }
}

// POST /players
export async function createPlayer(newPlayer) {
    
    let url = `${api_url}players`;
    try {
        if (!player){
            player = await getDataUserFromIpGeolocation(newPlayer);
        } else {
            player.score = newPlayer.score;
            player.time = newPlayer.time;
            player.difficulty = newPlayer.difficulty;
            player.player_id = playerID;
        }
        return await axios.post(url, player);
    } catch (error) {
        console.error(error);
    }
}


const getDataUserFromIpGeolocation = async (player) => {
    const response = await fetch(URL_IPGEOLOCATION);
    const data = await response.json();
    player.country = data.country_name;
    player.city = data.city;
    player.latitude = data.latitude;
    player.longitude = data.longitude;
    player.country_flag = data.country_flag;
    player.player_id = playerID;

    return await player;
};

async function getPlayer() {
    player = await fetchPlayer(playerID);
    if (player) {
        setName(player.name);
    }
}

getPlayer();
