import axios from 'axios';
import { DIFFICULTY } from '/src/utils/config.js';
import { ISPRODUCTION } from '/src/utils/consts.js';
import { playerID, setName } from '/src/utils/player.js';

// ============================================================================
// CONFIGURACIÓN DE API
// ============================================================================

const API_CONFIG = {
    local: 'http://localhost/api/',
    production: 'https://tetrisbackend.saig.cl/api/',
};

const IPGEOLOCATION_CONFIG = {
    apiKey: '33ce76efdd2c425fba086db0e27acc5e',
    baseUrl: 'https://api.ipgeolocation.io/ipgeo',
};

// Seleccionar URL base según entorno
const API_BASE_URL = ISPRODUCTION ? API_CONFIG.production : API_CONFIG.production;

// ============================================================================
// ESTADO DE LA API
// ============================================================================

let isAPIAvailable = true;
let apiHealthCheckDone = false;

// ============================================================================
// INSTANCIA DE AXIOS CONFIGURADA
// ============================================================================

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 5000, // 5 segundos timeout
    headers: {
        'Content-Type': 'application/json',
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

// Caché de jugadores en memoria (para modo offline)
const playersCache = {
    [DIFFICULTY.EASY]: [],
    [DIFFICULTY.MEDIUM]: [],
    [DIFFICULTY.HARD]: [],
};

// ============================================================================
// VERIFICACIÓN DE SALUD DE LA API
// ============================================================================

/**
 * Verifica si hay conexión con la API
 * @returns {Promise<boolean>}
 */
async function checkAPIHealth() {
    if (apiHealthCheckDone) {
        return isAPIAvailable;
    }

    try {
        await apiClient.get('/players', { 
            timeout: 3000,
            params: { quantity: 1, difficulty: DIFFICULTY.MEDIUM }
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
 * Obtiene la lista de jugadores
 * @param {number} quantity - Cantidad de jugadores a obtener (default: 5)
 * @param {string} difficulty - Nivel de dificultad (default: MEDIUM)
 * @returns {Promise<Object>} Respuesta con los datos de jugadores
 */
export async function fetchPlayers(quantity = 5, difficulty = DIFFICULTY.MEDIUM) {
    // Verificar salud de API primero
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
                quantity,
                difficulty,
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
 * Obtiene un jugador específico por ID
 * @param {string} playerId - ID del jugador
 * @returns {Promise<Object|null>} Datos del jugador o null si no existe
 */
export async function fetchPlayer(playerId) {
    if (!playerId) {
        console.warn('fetchPlayer: playerId es requerido');
        return null;
    }

    // Verificar salud de API primero
    await checkAPIHealth();

    if (!isAPIAvailable) {
        console.log('📦 API no disponible, saltando carga de jugador');
        return null;
    }

    try {
        const response = await apiClient.get(`/players/${playerId}`);
        return response.data;
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
 * Crea un nuevo jugador o actualiza el puntaje
 * @param {Object} newPlayer - Datos del nuevo jugador
 * @returns {Promise<Object>} Respuesta del servidor
 */
export async function createPlayer(newPlayer) {
    // Validación de datos
    if (!newPlayer?.name || newPlayer?.score === undefined) {
        throw new Error('Nombre y puntaje son requeridos');
    }

    // Verificar salud de API primero
    await checkAPIHealth();

    if (!isAPIAvailable) {
        console.warn('⚠️ API no disponible - no se puede guardar puntaje');
        
        // Guardar en caché local
        const localPlayer = {
            ...newPlayer,
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
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

        // Si ya tenemos datos en caché, usarlos
        if (cachedPlayerData) {
            playerData = {
                ...cachedPlayerData,
                score: newPlayer.score,
                time: newPlayer.time,
                difficulty: newPlayer.difficulty,
                player_id: playerID,
            };
        } else {
            // Obtener datos de geolocalización
            const geoData = await getUserGeolocationData();
            
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

            // Cachear para futuros usos
            cachedPlayerData = playerData;
        }

        const response = await apiClient.post('/players', playerData);
        
        // Actualizar caché
        if (response.data) {
            if (!playersCache[newPlayer.difficulty]) {
                playersCache[newPlayer.difficulty] = [];
            }
            playersCache[newPlayer.difficulty].unshift(response.data);
            playersCache[newPlayer.difficulty] = playersCache[newPlayer.difficulty].slice(0, 10);
        }
        
        return response;
    } catch (error) {
        console.error('❌ Error al crear/actualizar jugador:', error.message);
        
        if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
            isAPIAvailable = false;
            
            // Guardar en caché local como fallback
            const localPlayer = {
                ...newPlayer,
                id: Date.now(),
                date: new Date().toISOString().split('T')[0],
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

/**
 * Obtiene datos de geolocalización del usuario
 * @returns {Promise<Object>} Datos de geolocalización
 */
async function getUserGeolocationData() {
    // Si ya está en caché, retornar
    if (cachedGeoData) {
        return cachedGeoData;
    }

    try {
        const url = `${IPGEOLOCATION_CONFIG.baseUrl}?apiKey=${IPGEOLOCATION_CONFIG.apiKey}`;
        const response = await fetch(url, { timeout: 3000 });
        
        if (!response.ok) {
            throw new Error('Error en la respuesta de geolocalización');
        }

        const data = await response.json();
        
        // Validar que tenga los campos necesarios
        const geoData = {
            country_name: data.country_name || 'Desconocido',
            city: data.city || 'Desconocido',
            latitude: data.latitude || 0,
            longitude: data.longitude || 0,
            country_flag: data.country_flag || '',
        };

        // Cachear
        cachedGeoData = geoData;
        
        return geoData;
    } catch (error) {
        console.warn('⚠️ Error al obtener geolocalización:', error.message);
        
        // Retornar datos por defecto si falla
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

/**
 * Carga los datos del jugador actual si existe
 */
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

// Inicializar al cargar el módulo (no bloqueante)
initializePlayer().catch(() => {
    console.log('ℹ️ Iniciando en modo offline');
});

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Limpia el caché de datos
 */
export function clearCache() {
    cachedPlayerData = null;
    cachedGeoData = null;
    Object.keys(playersCache).forEach(key => {
        playersCache[key] = [];
    });
}

/**
 * Obtiene el estado de la API
 */
export function getAPIStatus() {
    return {
        isAvailable: isAPIAvailable,
        healthCheckDone: apiHealthCheckDone,
    };
}

/**
 * Fuerza un recheck de la API
 */
export async function recheckAPI() {
    apiHealthCheckDone = false;
    return await checkAPIHealth();
}