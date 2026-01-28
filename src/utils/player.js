// Función para generar un identificador único
function generateUniqueID() {
    const timestamp = new Date().getTime();
    const randomValue = Math.random();
    return `player_${timestamp}_${randomValue}`;
}

// Función para establecer una cookie con el identificador único
function setUniqueIDCookie() {
    const uniqueID = generateUniqueID();
    document.cookie = `player_id=${uniqueID}; expires=Thu, 31 Dec 2037 23:59:59 UTC; path=/`;
}

// Función para obtener el identificador único de la cookie (si existe)
function getUniqueIDFromCookie() {
    const cookies = document.cookie.split('; ');
    for (const cookie of cookies) {
        const [name, value] = cookie.split('=');
        if (name === 'player_id') {
            return value;
        }
    }
    return null;
}

// ✅ NUEVO: Funciones para manejar el nombre en localStorage
function getStoredName() {
    try {
        return localStorage.getItem('player_name');
    } catch (error) {
        console.error('Error al leer nombre:', error);
        return null;
    }
}

function setStoredName(newName) {
    try {
        localStorage.setItem('player_name', newName);
    } catch (error) {
        console.error('Error al guardar nombre:', error);
    }
}

// Comprobar si ya existe un identificador único en la cookie
export let playerID = getUniqueIDFromCookie();

// Si no existe, generar uno nuevo y establecerlo en la cookie
if (!playerID) {
    setUniqueIDCookie();
    playerID = getUniqueIDFromCookie();
}

// ✅ MODIFICADO: name ahora se carga desde localStorage
export let name = getStoredName();

export function setName(newName) {
    name = newName;
    setStoredName(newName); // ✅ Persistir en localStorage
}

export function hasPlayerName() {
    return name !== null && name !== '';
}

// ✅ NUEVO: Generar nombre único para evitar duplicados
export function getUniqueDisplayName(baseName, existingNames = []) {
    if (!existingNames.includes(baseName)) {
        return baseName;
    }
    
    // Si el nombre ya existe, agregar un número
    let counter = 2;
    let uniqueName = `${baseName} (${counter})`;
    
    while (existingNames.includes(uniqueName)) {
        counter++;
        uniqueName = `${baseName} (${counter})`;
    }
    
    return uniqueName;
}