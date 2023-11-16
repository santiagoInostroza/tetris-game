import axios from 'axios';
import { DIFFICULTY } from '/src/utils/config.js';
import {ISPRODUCTION } from '/src/utils/consts.js';

const API_URL_LOCAL = 'http://localhost/api/';
const API_URL_PRODUCCION = 'http://tetrisbackend.saig.cl/api/';
let url = null;
let api_url = null;

if(ISPRODUCTION){
    api_url = API_URL_PRODUCCION;
}
else{
    api_url = API_URL_LOCAL;
}

const getDataUser = async () => {
   const response = await fetch('http://ip-api.com/json');
  return await response.json();
};

export async function fetchPlayers(quantity = 3, difficulty = DIFFICULTY.MEDIUM) {
   
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

export async function createPlayer(player) {
    let url = `${api_url}players`;
    try {
        let data = await getDataUser();
        player.country = data.country;
        player.city = data.city;
        player.latitude = data.lat;
        player.longitude = data.lon;
        return await axios.post(url, player);
    } catch (error) {
        console.error(error);
    }
}

