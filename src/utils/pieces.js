const PIECES_EASY = [
    [
        [1, 1,],
        [1, 1,],
    ],
    [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
    ],
    [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0],
    ],
    [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0],
    ],
    [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
    ],
    [
        [1, 1, 1],
        [1, 0, 0],
        [0, 0, 0],
    ],
    [
        [1, 1, 1],
        [0, 0, 1],
        [0, 0, 0],
    ],
]

const PIECES_MEDIUM = [
    [
        [2]
    ],
    [
        [2, 0, 0],
        [2, 0, 0],
        [2, 2, 2]
    ],
    [
        [2, 2, 2],
        [2, 0, 2],
        [2, 0, 2]
    ],
    [
        [0, 0, 2],
        [2, 2, 2],
        [0, 0, 2]
    ],
    [
        [0, 0, 2],
        [0, 2, 2],
        [2, 2, 0]
    ],
    [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [2, 2, 2, 2, 2],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
    ],

]

const PIECES_HARD = [
    [
        [3, 0, 3],
        [3, 3, 3],
        [3, 0, 3]
    ],
    [
        [0, 3, 0],
        [3, 3, 3],
        [0, 3, 0],
    ],
    [
        [3, 0, 3],
        [0, 3, 0],
        [3, 0, 3],
    ],
    [
        [0, 0, 2, 0, 0],
        [0, 2, 2, 2, 0],
        [2, 2, 2, 2, 2],
        [0, 0, 2, 0, 0],
        [0, 0, 0, 0, 0],
    ]
    
]



export const PIECES = {
    EASY: PIECES_EASY,
    MEDIUM:PIECES_EASY.concat(PIECES_MEDIUM),
    HARD: PIECES_EASY.concat(PIECES_MEDIUM).concat(PIECES_HARD)
}

export const COLORS = [
    '#FF0000',
    '#00FF00',
    '#0000FF',
    '#FFFF00',
    '#00FFFF',
    '#FF00FF',
    '#C0C0C0',
    'ghost',
    '#800000',
    '#808000',
    '#008000',
    '#800080',
    '#008080',
    '#000000',
    '#FFA500',
    '#FFC0CB',
    'christmas',
    '#FFD700',
    '#FFDAB9',
    '#FFDEAD',
]


