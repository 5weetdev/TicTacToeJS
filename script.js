// TODO: implement effects, sounds, scoreboard, multiplayer, login, logout, neural network that learn on player style

// References:
const synaptic = window.synaptic;

// Buttons for tic tac toe
const elements = document.querySelectorAll(".square-button");

// Elements that will display when game finished
const winDiv = document.getElementById("win-div");
const winText = document.getElementById("win-text");
const resetButton = document.getElementById("reset-button");
const autoButton = document.getElementById("auto-button");
const scoreText = document.getElementById("score");

// Players
const PLAYER_X = -1;
const PLAYER_O = 1;

class TicTacToe {
    constructor(size = 3) {
        this.size = size;
        this.board = Array.from({ length: size }, () => Array(size).fill(0));
        this.currentPlayer = 1;
        this.winner = null;
    }

    reset() {
        this.board = Array.from({ length: this.size }, () =>
            Array(this.size).fill(0)
        );
        this.currentPlayer = 1;
        this.winner = null;
    }

    makeMove(row, col) {
        if (!this.isGameOver() && this.board[row][col] === 0) {
            this.board[row][col] = this.currentPlayer;
            this.checkWinner(row, col);
            this.currentPlayer = -this.currentPlayer;
            return true;
        } else {
            this.currentPlayer = -this.currentPlayer;
            console.log("Wrong cell!");
            return false;
        }
    }

    getRandom() {
        const cells = this.getAvailableCells();
        return cells[Math.floor(Math.random() * cells.length)];
    }

    isGameOver() {
        return (
            this.winner !== null ||
            this.board.every((row) => row.every((cell) => cell !== 0))
        );
    }

    isDraw() {
        return this.isGameOver() && this.winner === null;
    }

    getAvailableCells() {
        const availableCells = [];

        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.board[row][col] === 0) {
                    availableCells.push([row, col]);
                }
            }
        }

        return availableCells;
    }

    checkWinner(row, col) {
        if (
            this.checkLine(this.board[row]) ||
            this.checkLine(this.board.map((r) => r[col]))
        ) {
            this.winner = this.currentPlayer;
        }

        if (row === col && this.checkLine(this.board.map((r, i) => r[i]))) {
            this.winner = this.currentPlayer;
        }

        if (
            row + col === this.size - 1 &&
            this.checkLine(this.board.map((r, i) => r[this.size - 1 - i]))
        ) {
            this.winner = this.currentPlayer;
        }

        return this.winner === null;
    }

    checkLine(line) {
        return (
            Math.abs(line.reduce((acc, cell) => acc + cell, 0)) === this.size
        );
    }
}

function getCookieExpiration() {
    const expirationDate = new Date();

    // Set the cookie expiration to 1 year from now
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);

    return expirationDate.toUTCString();
}

function saveScoreToCookie(score) {
    document.cookie = `score=${score}; expires=${getCookieExpiration()}; path=/`;
}

function playSound() {
    var context = new (window.AudioContext || window.webkitAudioContext)();
    var source = context.createBufferSource();

    var sound = Math.floor(Math.random() * 5);

    // Fetch the sound file
    fetch(`sounds/hit${sound}.mp3`)
        .then((response) => response.arrayBuffer())
        .then((data) => context.decodeAudioData(data))
        .then((buffer) => {
            source.buffer = buffer;
            source.connect(context.destination);
            source.start(0);

            // Schedule the source to stop after the buffer duration
            source.onended = function () {
                source.stop();
            };
        })
        .catch((error) => console.error(error));
}

function loadScoreFromCookie() {
    const allCookies = document.cookie;

    // Split the cookies into an array
    const cookiesArray = allCookies.split(";");

    // Find the 'score' cookie
    for (const cookie of cookiesArray) {
        const [name, value] = cookie.trim().split("=");

        if (name === "score") {
            // Parse the value as an integer and return it
            return parseInt(value, 10);
        }
    }

    // Return null if the 'score' cookie is not found
    return 0;
}

function ComputerTurn() {
    if (game.isGameOver()) return;

    const [row, col] = game.getRandom();
    //let arr = game.getAvailableCells();
    //const [row, col] = arr[Math.floor(Math.random() * arr.length)]
    const index = row * game.size + col;

    CompleteTurn(index);

    elements[index].classList.add("o-button");

    CheckForGameOver();
}

function CheckForGameOver() {
    if (!game.isGameOver()) return;

    var massage = "";
    if (game.isDraw()) {
        massage = "Нічия!";
    } else if (game.currentPlayer === PLAYER_X) {
        massage = "Перемога!";
        score++;
        scoreText.textContent = score;
        saveScoreToCookie(score);
    } else {
        massage = "Ви програли :(";
    }

    winText.textContent = massage;

    winDiv.classList.remove("hidden");
}

function ResetGame() {
    game.reset();

    for (let i = 0; i < elements.length; i++) {
        const item = elements[i];

        item.classList.remove("square-button-scale");
        item.classList.remove("x-button");
        item.classList.remove("o-button");
    }

    winDiv.classList.add("hidden");
}

function CompleteTurn(index, sound = true) {
    const col = Math.floor(index / game.size);
    const row = index % game.size;

    game.makeMove(col, row);

    if (sound) {
        playSound();
    }
}

// Load score from cookie
let score = loadScoreFromCookie();
scoreText.textContent = score;

// Tic tac toe game
const game = new TicTacToe();

// Reset the game button click event
resetButton.addEventListener("click", function () {
    ResetGame();
});

autoButton.addEventListener("click", function () {
    if (game.isGameOver()) {
        ResetGame();
    }

    var timeout = 0;
    while (!game.isGameOver()) {
        if (game.currentPlayer === PLAYER_O && !game.isGameOver()) {
            var col;
            var row;

            // X
            [row, col] = game.getRandom();
            var index = row * game.size + col;

            CompleteTurn(index, false);

            elements[index].classList.add("x-button");

            CheckForGameOver();

            // O
            [row, col] = game.getRandom();
            index = row * game.size + col;

            CompleteTurn(index, false);

            elements[index].classList.add("o-button");

            CheckForGameOver();

            timeout++;
            if(timeout > 5000){
                console.log("Timeout!");
                break;
            }
        }
        else
        {
            break;
        }
    }
});


for (let i = 0; i < elements.length; i++) {
    const item = elements[i];
    item.addEventListener("click", function () {
        if (
            game.currentPlayer === PLAYER_O &&
            game.board[Math.floor(i / 3)][i % 3] === 0 &&
            !game.isGameOver()
        ) {
            CompleteTurn(i);

            item.classList.add("x-button");

            setTimeout(() => ComputerTurn(), 500);

            CheckForGameOver();
        }
    });
}
