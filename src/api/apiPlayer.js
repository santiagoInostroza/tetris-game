import axios from 'axios';
import { DIFFICULTY } from '/src/utils/config.js';
import { ISPRODUCTION } from '/src/utils/consts.js';
import { playerID, setName } from '/src/utils/player.js';

// ============================================================================
// CONFIGURACIÓN DE API - SUPABASE
// ============================================================================

const SUPABASE_CONFIG = {
    url: 'qyhvhcksequoqdqqrbdk.supabase.co',
    anonKey: 'sb_publishable_9AXBUSTlN-p0O87dg36HYw_zUbPipyo',     
};

const IPGEOLOCATION_CONFIG = {
    apiKey: '33ce76efdd2c425fba086db0e27acc5e',
    baseUrl: 'https://api.ipgeolocation.io/ipgeo',
};

// URL base de Supabase
const API_BASE_URL = `https://${SUPABASE_CONFIG.url}/rest/v1`;

// ============================================================================
// ESTADO DE LA API
// ============================================================================

let isAPIAvailable = true;
let apiHealthCheckDone = false;

// ============================================================================
// INSTANCIA DE AXIOS CONFIGURADA PARA SUPABASE
// ============================================================================

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
    },
});

// Interceptor para logging en desarrollo
if (!ISPRODUCTION) {
    apiClient.interceptors.request.use(
        (config) => {
            console.log('🚀 API Request:', config.method.toUpperCase(), config.url);
            return config;
        },
        (error) => {
            console.error('❌ Request Error:', error);
            return Promise.reject(error);
        }
    );

    apiClient.interceptors.response.use(
        (response) => {
            console.log('✅ API Response:', response.status, response.config.url);
            return response;
        },
        (error) => {
            console.error('❌ Response Error:', error.response?.status, error.config?.url);
            return Promise.reject(error);
        }
    );
}

// ============================================================================
// CACHÉ DE DATOS
// ============================================================================

let cachedPlayerData = null;
let cachedGeoData = null;

const playersCache = {
    [DIFFICULTY.EASY]: [],
    [DIFFICULTY.MEDIUM]: [],
    [DIFFICULTY.HARD]: [],
};

// ============================================================================
// VERIFICACIÓN DE SALUD DE LA API
// ============================================================================

async function checkAPIHealth() {
    if (apiHealthCheckDone) {
        return isAPIAvailable;
    }

    try {
        await apiClient.get('/players', { 
            timeout: 3000,
            params: { 
                select: 'id',
                limit: 1
            }
        });
        isAPIAvailable = true;
        apiHealthCheckDone = true;
        console.log('✅ API disponible');
        return true;
    } catch (error) {
        isAPIAvailable = false;
        apiHealthCheckDone = true;
        console.warn('⚠️ API no disponible - modo offline activado');
        return false;
    }
}

// ============================================================================
// FUNCIONES DE API
// ============================================================================

/**
 * Obtiene la lista de jugadores (top scores por dificultad)
 */
export async function fetchPlayers(quantity = 5, difficulty = DIFFICULTY.MEDIUM) {
    await checkAPIHealth();

    if (!isAPIAvailable) {
        console.log('📦 Usando caché local para jugadores');
        return {
            data: playersCache[difficulty] || [],
            fromCache: true
        };
    }

    try {
        const response = await apiClient.get('/players', {
            params: {
                difficulty: `eq.${difficulty}`,
                order: 'score.desc,created_at.desc',
                limit: quantity,
            },
        });

        // Cachear para uso offline
        if (response.data) {
            playersCache[difficulty] = response.data;
        }

        return response;
    } catch (error) {
        console.warn('⚠️ Error al obtener jugadores, usando caché:', error.message);
        isAPIAvailable = false;
        
        return {
            data: playersCache[difficulty] || [],
            fromCache: true
        };
    }
}

/**
 * Obtiene un jugador específico por player_id (UUID)
 */
export async function fetchPlayer(playerId) {
    if (!playerId) {
        console.warn('fetchPlayer: playerId es requerido');
        return null;
    }

    await checkAPIHealth();

    if (!isAPIAvailable) {
        console.log('📦 API no disponible, saltando carga de jugador');
        return null;
    }

    try {
        const response = await apiClient.get('/players', {
            params: {
                player_id: `eq.${playerId}`,
                limit: 1,
            }
        });
        
        return response.data?.[0] || null;
    } catch (error) {
        if (error.response?.status === 404) {
            console.log('ℹ️ Jugador no encontrado:', playerId);
            return null;
        }
        
        if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
            console.warn('⚠️ Error de red al obtener jugador');
            isAPIAvailable = false;
            return null;
        }
        
        console.error('❌ Error al obtener jugador:', error.message);
        return null;
    }
}

/**
 * Crea un nuevo jugador (Supabase siempre crea nuevo registro)
 */
export async function createPlayer(newPlayer) {
    if (!newPlayer?.name || newPlayer?.score === undefined) {
        throw new Error('Nombre y puntaje son requeridos');
    }

    await checkAPIHealth();

    if (!isAPIAvailable) {
        console.warn('⚠️ API no disponible - no se puede guardar puntaje');
        
        const localPlayer = {
            ...newPlayer,
            id: Date.now(),
            created_at: new Date().toISOString(),
            country: 'Local',
            city: 'Local',
        };
        
        if (!playersCache[newPlayer.difficulty]) {
            playersCache[newPlayer.difficulty] = [];
        }
        
        playersCache[newPlayer.difficulty].unshift(localPlayer);
        playersCache[newPlayer.difficulty] = playersCache[newPlayer.difficulty].slice(0, 10);
        
        return {
            data: localPlayer,
            fromCache: true,
            message: 'Puntaje guardado localmente (sin conexión al servidor)'
        };
    }

    try {
        let playerData;

        // Obtener datos de geolocalización
        const geoData = cachedGeoData || await getUserGeolocationData();
        
        playerData = {
            name: newPlayer.name,
            score: newPlayer.score,
            time: newPlayer.time,
            difficulty: newPlayer.difficulty,
            player_id: playerID,
            country: geoData.country_name,
            city: geoData.city,
            latitude: geoData.latitude,
            longitude: geoData.longitude,
            country_flag: geoData.country_flag,
        };

        console.log('📤 Datos a enviar:', JSON.stringify(playerData, null, 2));

        // Supabase: POST crea nuevo registro
        const response = await apiClient.post('/players', playerData, {
            headers: {
                'Prefer': 'return=representation' // Retorna el objeto creado
            }
        });
        
        // Actualizar caché
        if (response.data?.[0]) {
            if (!playersCache[newPlayer.difficulty]) {
                playersCache[newPlayer.difficulty] = [];
            }
            playersCache[newPlayer.difficulty].unshift(response.data[0]);
            playersCache[newPlayer.difficulty] = playersCache[newPlayer.difficulty].slice(0, 10);
        }
        
        return {
            data: response.data[0],
            message: 'Puntaje guardado exitosamente'
        };
    } catch (error) {
        console.error('❌ Error al crear jugador:', error.message);
        
        if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
            isAPIAvailable = false;
            
            const localPlayer = {
                ...newPlayer,
                id: Date.now(),
                created_at: new Date().toISOString(),
                country: 'Local',
                city: 'Local',
            };
            
            if (!playersCache[newPlayer.difficulty]) {
                playersCache[newPlayer.difficulty] = [];
            }
            
            playersCache[newPlayer.difficulty].unshift(localPlayer);
            playersCache[newPlayer.difficulty] = playersCache[newPlayer.difficulty].slice(0, 10);
            
            return {
                data: localPlayer,
                fromCache: true,
                message: 'Puntaje guardado localmente (servidor no disponible)'
            };
        }
        
        throw new Error('No se pudo guardar el puntaje');
    }
}

// ============================================================================
// GEOLOCALIZACIÓN
// ============================================================================

async function getUserGeolocationData() {
    if (cachedGeoData) {
        return cachedGeoData;
    }

    try {
        const url = `${IPGEOLOCATION_CONFIG.baseUrl}?apiKey=${IPGEOLOCATION_CONFIG.apiKey}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Error en la respuesta de geolocalización');
        }

        const data = await response.json();
        
        const geoData = {
            country_name: data.country_name || 'Desconocido',
            city: data.city || 'Desconocido',
            latitude: data.latitude || 0,
            longitude: data.longitude || 0,
            country_flag: data.country_flag || '',
        };

        cachedGeoData = geoData;
        return geoData;
    } catch (error) {
        console.warn('⚠️ Error al obtener geolocalización:', error.message);
        
        return {
            country_name: 'Desconocido',
            city: 'Desconocido',
            latitude: 0,
            longitude: 0,
            country_flag: '',
        };
    }
}

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

async function initializePlayer() {
    try {
        const player = await fetchPlayer(playerID);
        
        if (player) {
            setName(player.name);
            cachedPlayerData = player;
        }
    } catch (error) {
        console.warn('⚠️ No se pudo inicializar jugador:', error.message);
    }
}

initializePlayer().catch(() => {
    console.log('ℹ️ Iniciando en modo offline');
});

// ============================================================================
// UTILIDADES
// ============================================================================

export function clearCache() {
    cachedPlayerData = null;
    cachedGeoData = null;
    Object.keys(playersCache).forEach(key => {
        playersCache[key] = [];
    });
}

export function getAPIStatus() {
    return {
        isAvailable: isAPIAvailable,
        healthCheckDone: apiHealthCheckDone,
    };
}

export async function recheckAPI() {
    apiHealthCheckDone = false;
    return await checkAPIHealth();
}