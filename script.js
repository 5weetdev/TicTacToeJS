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

class TicTacToeLearner {
    constructor(size = 3) {
        this.currentPlayer = 1;

        this.network = new synaptic.Architect.Perceptron(9, 3, 9);

        this.trainer = new synaptic.Trainer(this.network);
        this.learningRate = 0.5;
        this.discountFactor = 0.9;
        this.epsilon = 0.2;
        this.memory = [];
        this.trainset = [];
        this.wins = 0;
        this.looses = 0;
    }

    trainNetwork(epoch = 1000) {
        const game = new TicTacToe(3);
        for (let index = 0; index < epoch; index++) {
            while (!game.isGameOver()) {
                var row;
                var col;
                if (game.currentPlayer === this.currentPlayer) {
                    [row, col] = this.getMoveRowColFromHidden(game);
                    game.makeMove(row, col);
                } else {
                    [row, col] = game.getRandom();
                    game.makeMove(row, col);
                }

                if (game.winner !== null && !game.isDraw()) {
                    const flat = this.flattenBoard(game.board);
                    const output = Array(9).fill(0);
                    output[row * 3 + col] =
                        game.winner === this.currentPlayer ? 1 : -1;
                    // this.trainset.push({
                    //     input: flat,
                    //     output: output
                    // });
                    if (game.winner === this.currentPlayer) {
                        console.log("Win");
                        this.wins += 1;
                    } else {
                        console.log("Lose");
                        this.looses += 1;
                    }
                    console.log(output);
                    const out = this.network.activate(flat);
                    console.log(out);
                    this.network.propagate(this.learningRate, output);
                }
            }

            //this.trainer.train(this.trainset);

            game.reset();
        }

        console.log("Wins: ", this.wins);
        console.log("Looses: ", this.looses);
    }

    train() {
        for (let i = 0; i < this.memory.length; i++) {
            const { state, action, reward, nextState } = this.memory[i];
            const flatState = state;
            const flatNextState = nextState;

            // Q-learning update rule
            const target =
                reward +
                this.discountFactor *
                    Math.max(...this.network.activate(flatNextState));
            this.network.activate(flatState);
            this.network.propagate(this.learningRate, [target]);
        }

        // Clear the memory after training
        this.memory = [];
    }

    trainQ(epochs = 100) {
        const ticTacToeGame = new TicTacToe();
        for (let epoch = 0; epoch < epochs; epoch++) {
            while (!ticTacToeGame.isGameOver()) {
                const prevState = this.flattenBoard(ticTacToeGame.board);
                var row;
                var col;
                if (ticTacToeGame.currentPlayer === this.currentPlayer) {
                    [row, col] = this.getMoveRowColFromHidden(ticTacToeGame);
                    if (!ticTacToeGame.makeMove(row, col)) {
                        [row, col] = game.getRandom();
                        game.makeMove(row, col);
                    }
                } else {
                    [row, col] = game.getRandom();
                    game.makeMove(row, col);
                }

                const reward = ticTacToeGame.isGameOver()
                    ? ticTacToeGame.winner === this.currentPlayer
                        ? 1
                        : -1
                    : 0;
                const nextState = this.flattenBoard(ticTacToeGame.board);

                this.remember(prevState, [row, col], reward, nextState);
            }

            this.train();
            ticTacToeGame.reset();
        }
    }

    remember(state, action, reward, nextState) {
        this.memory.push({ state, action, reward, nextState });
    }

    flattenBoard(board) {
        return board.reduce((acc, row) => acc.concat(row), []);
    }

    getMoveRowColFromHidden(game) {
        if (Math.random() < this.epsilon) {
            console.log("random choosen to discover!");
            return game.getRandom();
        }

        const input = this.flattenBoard(game.board);
        //const output = this.network.activate(input);
        //console.log(input);
        //this.network.layers.hidden[this.network.layers.hidden.length - 1].propagate(1, [1, 0, 0, 0, 0, 0, 0, 0, 0]);

        //this.network.layers.input.activate(input);
        //this.network.layers.hidden[this.network.layers.hidden.length - 2].activate();
        //var preLastLayer = this.network.layers.hidden[this.network.layers.hidden.length - 1].activate();
        var preLastLayer = this.network.activate(input);
        //console.log(preLastLayer);

        let maxOutput = Number.NEGATIVE_INFINITY;
        let selectedMove = [0, 0];

        for (let index = 0; index < preLastLayer.length; index++) {
            const row = index % game.size;
            const col = Math.floor(index / game.size);
            if (game.board[row][col] === 0 && preLastLayer[index] > maxOutput) {
                maxOutput = preLastLayer[index];
                selectedMove = [row, col];
            }
        }

        return selectedMove;
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

    const [row, col] = qAgent.getMoveRowColFromHidden(game);
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

var prestate;
function CompleteTurn(index, sound = true) {
    const col = Math.floor(index / game.size);
    const row = index % game.size;

    const flat = qAgent.flattenBoard(game.board);
    if (game.currentPlayer === PLAYER_O) {
        prestate = qAgent.flattenBoard(game.board);
    }

    game.makeMove(col, row);

    if (game.isGameOver() && !game.isDraw()) {
        const output = Array(9).fill(0);

        output[row * 3 + col] = 1;
        qAgent.trainset.push({
            input: game.winner === PLAYER_O ? prestate : flat,
            output: output,
        });
        var error = qAgent.trainer.train(qAgent.trainset, {
            rate: 0.8,
            iterations: 1000,
            error: 0.005,
            shuffle: true,
            log: 1000,
            cost: synaptic.Trainer.cost.CROSS_ENTROPY,
        });
        console.log(error);
    }

    if (sound) {
        playSound();
    }
}

// Load score from cookie
let score = loadScoreFromCookie();
scoreText.textContent = score;

// Tic tac toe game
const game = new TicTacToe();
const qAgent = new TicTacToeLearner();

// Reset the game button click event
resetButton.addEventListener("click", function () {
    ResetGame();
});

autoButton.addEventListener("click", function () {
    if (game.isGameOver()) {
        ResetGame();
    }

    while (!game.isGameOver()) {
        if (game.currentPlayer === PLAYER_O && !game.isGameOver()) {
            var col;
            var row;

            // X
            [row, col] = qAgent.getMoveRowColFromHidden(game);
            var index = row * game.size + col;

            CompleteTurn(index, false);

            elements[index].classList.add("x-button");

            CheckForGameOver();

            // O
            [row, col] = qAgent.getMoveRowColFromHidden(game);
            index = row * game.size + col;

            CompleteTurn(index, false);

            elements[index].classList.add("o-button");

            CheckForGameOver();
        }
    }
});

//qAgent.trainNetwork();
//qAgent.trainQ();

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
