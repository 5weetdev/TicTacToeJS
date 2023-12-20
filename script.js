// TODO: implement effects, sounds, scoreboard, multiplayer, login, logout, neural network that learn on player style

// References:
const synaptic = window.synaptic;

// Buttons for tic tac toe
const elements = document.querySelectorAll(".square-button");

// Elements that will display when game finished
const winDiv = document.getElementById("win-div");
const winText = document.getElementById("win-text");
const resetButton = document.getElementById("reset-button");
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

    isGameOver() {
        return (
            this.winner !== null ||
            this.board.every((row) => row.every((cell) => cell !== 0))
        );
    }

    isDraw() {
        return this.isGameOver() && this.winner === null;
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

class QAgent {
    constructor(size = 3) {
        this.size = size;
        this.network = new synaptic.Architect.Perceptron(
            this.size * this.size,
            9,
            9,
            9,
            9,
            1
        );
        this.trainer = new synaptic.Trainer(this.network);
        this.learningRate = 0.1;
        this.discountFactor = 0.95;
        // A higher epsilon promotes exploration
        this.epsilon = 0.6;
        this.memory = [];
    }

    randomizeWeights() {
        const layers = this.network.layers;
        for (let i = 1; i < layers.length; i++) {
            const neurons = layers[i].neurons();
            for (let j = 0; j < neurons.length; j++) {
                const weights = neurons[j].weights;
                for (let k = 0; k < weights.length; k++) {
                    weights[k] = Math.random() * 2 - 1;
                }
            }
        }
    }

    flattenState(state) {
        return state.flat();
    }

    chooseAction(state, log = false) {
        // Calculate empty cells once at the start
        const emptyCells = [];
        for (let i = 0; i < this.size * this.size; i++) {
            if (state[Math.floor(i / this.size)][i % this.size] === 0) {
                emptyCells.push(i);
            }
        }

        if (Math.random() < this.epsilon) {
            // Exploration: choose a random action from empty cells
            if (emptyCells.length === 0) {
                // If all cells are occupied, choose a random action
                return Math.floor(Math.random() * (this.size * this.size));
            } else {
                // Choose a random action from empty cells
                const randomEmptyCell =
                    emptyCells[Math.floor(Math.random() * emptyCells.length)];
                return randomEmptyCell;
            }
        } else {
            // Exploitation: choose the action with the highest Q-value
            const flatState = this.flattenState(state);
            const actionValues = this.network.activate(flatState);

            if (emptyCells.length === 0) {
                // If all cells are occupied, choose a random action
                if (log) {
                    console.log("Random choosen!");
                }
                return Math.floor(Math.random() * (this.size * this.size));
            } else {
                // Choose the action with the highest Q-value from empty cells
                const chosenAction = emptyCells.reduce(
                    (maxIndex, currentIndex) => {
                        return actionValues[currentIndex] >
                            actionValues[maxIndex]
                            ? currentIndex
                            : maxIndex;
                    },
                    emptyCells[0]
                );
                return chosenAction;
            }
        }
    }

    getEmptyCell(state) {
        const emptyCells = [];
        for (let i = 0; i < this.size * this.size; i++) {
            if (state[Math.floor(i / this.size)][i % this.size] === 0) {
                emptyCells.push(i);
            }
        }
        const randomEmptyCell =
            emptyCells.length > 0
                ? emptyCells[Math.floor(Math.random() * emptyCells.length)]
                : -1;
        return randomEmptyCell;
    }

    remember(state, action, reward, nextState) {
        const flatState = this.flattenState(state);
        const flatNextState = this.flattenState(nextState);
        this.memory.push({ flatState, action, reward, flatNextState });
    }

    train() {
        for (let i = 0; i < this.memory.length; i++) {
            const { flatState, action, reward, flatNextState } = this.memory[i];
            const inputArray = flatState.concat(
                action / (this.size * this.size)
            );
            const target = [
                reward +
                    this.discountFactor *
                        Math.max(...this.network.activate(flatNextState)),
            ];
            this.network.propagate(this.learningRate, target, inputArray);
        }
        this.memory = [];
    }

    calculateError() {
        let totalError = 0;
    
        for (let i = 0; i < this.memory.length; i++) {
            const { flatState, action, reward, flatNextState } = this.memory[i];
    
            // Ensure the flattened state and action are correct
            if (!flatState || flatState.length !== this.size * this.size) {
                console.error('Invalid flattened state:', flatState);
                continue;
            }
    
            const inputArray = flatState.concat(action / (this.size * this.size));
    
            // Ensure the input array has the correct length
            if (inputArray.length !== this.size * this.size + 1) {
                console.error('Invalid input array:', inputArray);
                continue;
            }
    
            const target = [
                reward +
                this.discountFactor *
                Math.max(...this.network.activate(flatNextState)),
            ];
    
            // Ensure the target array has the correct length
            if (target.length !== 1) {
                console.error('Invalid target array:', target);
                continue;
            }
    
            const predictedQValue = this.network.activate(inputArray)[0];
            const error = Math.pow(target[0] - predictedQValue, 2);
            totalError += error;
        }
    
        // Check if there is no training data to avoid division by zero
        const meanSquaredError = this.memory.length > 0 ? totalError / this.memory.length : 0;
        return meanSquaredError;
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

function trainNetwork(qAgent, epochs = 100) {
    var ticTacToeGame = new TicTacToe();
    for (let epoch = 0; epoch < epochs; epoch++) {
        let agentWins = 0;
        let opponentWins = 0;

        while (!ticTacToeGame.isGameOver()) {
            // Agent's move
            const agentAction = qAgent.chooseAction(ticTacToeGame.board);
            const agentPrevState = JSON.parse(
                JSON.stringify(ticTacToeGame.board)
            );

            const agentRow = Math.floor(agentAction / ticTacToeGame.size);
            const agentCol = agentAction % ticTacToeGame.size;

            if (!ticTacToeGame.makeMove(agentRow, agentCol)) {
                // If the move is invalid, skip the rest of the loop
                continue;
            }

            // Check for game over after agent's move
            if (ticTacToeGame.isGameOver()) {
                if (ticTacToeGame.winner === qAgent.currentPlayer) {
                    agentWins++;
                } else if (ticTacToeGame.winner !== null) {
                    opponentWins++;
                }
                break; // Exit the loop if the game is over
            }

            // Opponent's move
            const opponentAction = qAgent.getEmptyCell(ticTacToeGame.board);
            if (opponentAction >= 0) {
                const opponentRow = Math.floor(
                    opponentAction / ticTacToeGame.size
                );
                const opponentCol = opponentAction % ticTacToeGame.size;
                ticTacToeGame.makeMove(opponentRow, opponentCol);

                // Check for game over after opponent's move
                if (ticTacToeGame.isGameOver()) {
                    if (ticTacToeGame.winner === qAgent.currentPlayer) {
                        agentWins++;
                    } else if (ticTacToeGame.winner !== null) {
                        opponentWins++;
                    }
                }

                // Remember both agent and opponent moves
                const agentReward = ticTacToeGame.isGameOver()
                    ? ticTacToeGame.winner === qAgent.currentPlayer
                        ? 1
                        : -1
                    : 0;

                const agentNextState = JSON.parse(
                    JSON.stringify(ticTacToeGame.board)
                );

                qAgent.remember(
                    agentPrevState,
                    agentAction,
                    agentReward,
                    agentNextState
                );
            }
        }

        ticTacToeGame.reset(); // Reset the game for the next epoch
        qAgent.train();

        // Print win rate
        const totalGames = agentWins + opponentWins;
        const winRate = totalGames > 0 ? (agentWins / totalGames) * 100 : 0;
        console.log(`Epoch ${epoch + 1} - Win Rate: ${winRate.toFixed(2)}%`);

        const meanSquaredError = qAgent.calculateError();
        console.log('Mean Squared Error:', meanSquaredError);
    }
    console.log("Trained for ", epochs);
}

function ComputerTurn() {
    if (game.isGameOver()) return;

    const action = qAgent.chooseAction(game.board, true);
    const index = Math.floor(action);
    
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

function CompleteTurn(index) {
    const col = Math.floor(index / game.size);
    const row = index % game.size;

    game.makeMove(col, row);

    playSound();
}

// Load score from cookie
let score = loadScoreFromCookie();
scoreText.textContent = score;

// Tic tac toe game
const game = new TicTacToe();
const qAgent = new QAgent();
qAgent.randomizeWeights();

// Reset the game button click event
resetButton.addEventListener("click", function () {
    ResetGame();
});

trainNetwork(qAgent, 100);

for (let i = 0; i < elements.length; i++) {
    const item = elements[i];
    item.addEventListener("click", function () {
        if (
            game.currentPlayer === 1 &&
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
