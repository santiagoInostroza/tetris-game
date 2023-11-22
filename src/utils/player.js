// Función para generar un identificador único
function generateUniqueID() {
    // Genera un identificador único utilizando la fecha actual y un valor aleatorio
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
  
  // Comprobar si ya existe un identificador único en la cookie
  export let playerID = getUniqueIDFromCookie();
  
  // Si no existe, generar uno nuevo y establecerlo en la cookie
  if (!playerID) {
    setUniqueIDCookie();
    playerID = getUniqueIDFromCookie();
  }

  export let name = null;

  export function setName(newName) {
    name = newName;
  }
