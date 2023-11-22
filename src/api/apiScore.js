import axios from 'axios';
import { DIFFICULTY } from '/src/utils/config.js';
import {ISPRODUCTION } from '/src/utils/consts.js';

const API_URL_LOCAL = 'http://localhost/api/';
const API_URL_PRODUCCION = 'https://tetrisbackend.saig.cl/api/';
let url = null;
let api_url = null;



if(ISPRODUCTION){
    api_url = API_URL_PRODUCCION;
}
else{
    api_url = API_URL_LOCAL;
}

const API_KEY_IPGEOLOCATION = "33ce76efdd2c425fba086db0e27acc5e";
const URL_IPGEOLOCATION = "https://api.ipgeolocation.io/ipgeo?apiKey=" + API_KEY_IPGEOLOCATION;



const getDataUser = async () => {
   const response = await fetch(URL_IPGEOLOCATION);
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
        player.country = data.country_name;
        player.city = data.city;
        player.latitude = data.latitude;
        player.longitude = data.longitude;
        player.country_flag = data.country_flag;
        console.log('2', player);
        return await axios.post(url, player);
    } catch (error) {
        console.error(error);
    }
}

