<template>  
    <label 
        class="volume-switch" 
        @click="toggleState"
        role="switch"
        :aria-checked="modelValue"
        tabindex="0"
        @keydown.space.prevent="toggleState"
        @keydown.enter.prevent="toggleState"
    >
        <input 
            type="checkbox" 
            :checked="modelValue"
            @click.stop
            aria-hidden="true"
            tabindex="-1"
        >
        <svg viewBox="0 0 108 96" aria-hidden="true">
            <path d="M7,28 L35,28 L35,28 L59,8 L59,88 L35,68 L7,68 C4.790861,68 3,66.209139 3,64 L3,32 C3,29.790861 4.790861,28 7,28 Z"></path>
            <path d="M79,62 C83,57.3333333 85,52.6666667 85,48 C85,43.3333333 83,38.6666667 79,34 L49,3"></path>
            <path d="M95,69 C101.666667,61.6666667 105,54.3333333 105,47 C105,39.6666667 101.666667,32.3333333 95,25 L75.5,6 L49,33"></path>
        </svg>
    </label>
</template>

<script>
export default {
    name: "SwitchButton",
    props: {
        modelValue: {
            type: Boolean,
            required: true
        }
    },
    emits: ['update:modelValue'],
    methods: {
        toggleState() {
            this.$emit("update:modelValue", !this.modelValue);
        }
    }
};
</script>

<style scoped>
.volume-switch {
    --line: #fff;
    --line-width: 6px;
    --duration: .5s;
    position: relative;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    display: inline-flex;
    align-items: center;
    user-select: none;
}

.volume-switch:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.5);
    outline-offset: 4px;
    border-radius: 4px;
}

.volume-switch input {
    display: none;
}

.volume-switch svg {
    display: block;
    fill: none;
    stroke: var(--line);
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: var(--line-width);
    width: 24px;
    height: 24px;
    transition: transform 0.2s ease;
}

.volume-switch:hover svg {
    transform: scale(1.1);
}

.volume-switch:active svg {
    transform: scale(0.95);
}

.volume-switch input + svg path {
    animation: var(--name) var(--duration) ease forwards;
}

/* Animaciones cuando está checked */
.volume-switch input:checked + svg path:nth-child(1) {
    --name: shape;
}

.volume-switch input:checked + svg path:nth-child(2) {
    --name: small;
}

.volume-switch input:checked + svg path:nth-child(3) {
    --name: large;
}

/* Animaciones cuando está unchecked */
.volume-switch input:not(:checked) + svg path:nth-child(1) {
    --name: shape-r;
}

.volume-switch input:not(:checked) + svg path:nth-child(2) {
    --name: small-r;
}

.volume-switch input:not(:checked) + svg path:nth-child(3) {
    --name: large-r;
}

/* Keyframes */
@keyframes small {
    0%, 30% {
        stroke-dasharray: 0 0 30px 64px;
    }
    40% {
        stroke-dashoffset: 16px;
    }
    80%, 100% {
        stroke-dashoffset: 1px;
    }
    70% {
        stroke-dasharray: 0 43px 30px 64px;
    }
    100% {
        stroke-dasharray: 0 39px 30px 64px;
    }
}

@keyframes small-r {
    0% {
        stroke-dasharray: 0 39px 30px 64px;
    }
    0%, 40% {
        stroke-dashoffset: 1px;
    }
    70% {
        stroke-dashoffset: 16px;
    }
    70%, 100% {
        stroke-dasharray: 0 0 30px 64px;
    }
}

@keyframes large {
    0%, 30% {
        stroke-dasharray: 0 0 50px 84px;
    }
    40% {
        stroke-dashoffset: 16px;
    }
    80%, 100% {
        stroke-dashoffset: 1px;
    }
    70% {
        stroke-dasharray: 0 82px 32px 84px;
    }
    100% {
        stroke-dasharray: 0 78px 32px 84px;
    }
}

@keyframes large-r {
    0% {
        stroke-dasharray: 0 78px 32px 84px;
    }
    0%, 40% {
        stroke-dashoffset: 1px;
    }
    70% {
        stroke-dashoffset: 16px;
    }
    70%, 100% {
        stroke-dasharray: 0 0 50px 84px;
    }
}

@keyframes shape {
    0% {
        stroke-dasharray: 60px 0 184px;
        stroke-dashoffset: 0;
    }
    70% {
        stroke-dasharray: 63px 51px 184px;
        stroke-dashoffset: 21px;
    }
    100% {
        stroke-dasharray: 59px 47px 184px;
        stroke-dashoffset: 17px;
    }
}

@keyframes shape-r {
    0% {
        stroke-dasharray: 59px 47px 184px;
        stroke-dashoffset: 17px;
    }
    100% {
        stroke-dasharray: 60px 0 184px;
        stroke-dashoffset: 0;
    }
}
</style>