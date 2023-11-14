import { PIECES, DIFFICULTY } from '/src/utils/pieces.js';
import { ref, reactive } from 'vue';

export const difficulty = ref(DIFFICULTY.HARD);
export const pieces = ref(PIECES[difficulty.value]);

export const piece = reactive({
    position: { x: 5, y: 5 },
    matrix: pieces.value[Math.floor(Math.random() * pieces.value.length)],
});

let keysPressed = {};

export function handleKeyDown(event) {
    keysPressed[event.key] = true; // Marcar la tecla como presionada

    if (keysPressed[EVENT_MOVEMENTS.LEFT]) {
        return  'left'
    } else if (keysPressed[EVENT_MOVEMENTS.RIGHT]) {
        return 'right'
    }
    if (keysPressed[EVENT_MOVEMENTS.DOWN]) {
        return 'down'
    }
    if (event.key === EVENT_MOVEMENTS.ROTATE) {
        return 'rotate'
    } else if (event.
    key === EVENT_MOVEMENTS.SPACE) {
        return 'space'
    } 
}

export function handleKeyUp(event) {
    delete keysPressed[event.key]; // Marcar la tecla como no presionada
}

