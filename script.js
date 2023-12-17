// TODO: implement effects, sounds, scoreboard, multiplayer, login, logout, neural network that learn on player style

// Buttons for tic tac toe
const elements = document.querySelectorAll(".square-button");

// Elements that will display when game finished
const winDiv = document.getElementById("win-div");
const winText = document.getElementById("win-text");
const resetButton = document.getElementById("reset-button");
const scoreText = document.getElementById("score");

const PLAYER_X = 1;
const PLAYER_O = 2;
const EMPTY = 0;
const DRAW = -1;

// Array that stores grid of player placements
let squares = [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY];

let CurrentPlayerTurn = PLAYER_X;

// Load score from cookie 
let score = loadScoreFromCookie();
scoreText.textContent = score;

// Reset the game button click event
resetButton.addEventListener("click", function () {
    ResetGame();
});

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
    .then(response => response.arrayBuffer())
    .then(data => context.decodeAudioData(data))
    .then(buffer => {
        source.buffer = buffer;
        source.connect(context.destination);
        source.start(0);

        // Schedule the source to stop after the buffer duration
        source.onended = function() {
        source.stop();
        };
    })
    .catch(error => console.error(error));
  }

function loadScoreFromCookie() {
    const allCookies = document.cookie;
  
    // Split the cookies into an array
    const cookiesArray = allCookies.split(';');
  
    // Find the 'score' cookie
    for (const cookie of cookiesArray) {
      const [name, value] = cookie.trim().split('=');
  
      if (name === 'score') {
        // Parse the value as an integer and return it
        return parseInt(value, 10);
      }
    }
  
    // Return null if the 'score' cookie is not found
    return 0;
  }

function ComputerTurn(array, elements) {
    if(CurrentPlayerTurn === EMPTY) return;

    const filteredArray = array.filter((item) => item === EMPTY);

    if (filteredArray.length > 0) {
        let randomIndex = Math.floor(Math.random() * array.length);
        var temp = 0;
        while (array[randomIndex] !== 0) {
            randomIndex = Math.floor(Math.random() * (array.length + 1));

            if (temp > 1000) {
                console.log("Time out.");
                return;
            }
            temp++;
        }

        CompleteTurn(array, randomIndex, PLAYER_O);
        CurrentPlayerTurn = PLAYER_X;
        
        elements[randomIndex].classList.add("o-button");

        DisplayGameOverMassage(CheckForWinCondition(squares));
    } else {
        DisplayGameOverMassage(-1);
    }
}

function CheckForWinCondition(array) {
    // Check rows
    for (let i = 0; i < 9; i += 3) {
        if (
            array[i] === PLAYER_X &&
            array[i] === array[i + 1] &&
            array[i] === array[i + 2]
        ) {
            return PLAYER_X;
        } else if (
            array[i] === PLAYER_O &&
            array[i] === array[i + 1] &&
            array[i] === array[i + 2]
        ) {
            return PLAYER_O;
        }
    }

    // Check columns
    for (let i = 0; i < 3; i++) {
        if (
            array[i] === PLAYER_X &&
            array[i] === array[i + 3] &&
            array[i] === array[i + 6]
        ) {
            return PLAYER_X;
        } else if (
            array[i] === PLAYER_O &&
            array[i] === array[i + 3] &&
            array[i] === array[i + 6]
        ) {
            return PLAYER_O;
        }
    }

    // Check diagonals
    if (
        array[0] === PLAYER_X &&
        array[0] === array[4] &&
        array[0] === array[8]
    ) {
        return PLAYER_X;
    } else if (
        array[0] === PLAYER_O &&
        array[0] === array[4] &&
        array[0] === array[8]
    ) {
        return 2;
    }
    if (
        array[2] === PLAYER_X &&
        array[2] === array[4] &&
        array[2] === array[6]
    ) {
        return PLAYER_X;
    } else if (
        array[2] === PLAYER_O &&
        array[2] === array[4] &&
        array[2] === array[6]
    ) {
        return PLAYER_O;
    }

    return EMPTY; // No winner
}

function DisplayGameOverMassage(player) {
    if (player === EMPTY) return;

    var massage = "";
    if (player === PLAYER_X) {
        massage = "Перемога!";
        score++;
        scoreText.textContent = score;
        saveScoreToCookie(score);
    } else if (player === DRAW) {
        massage = "Нічия!";
    } else {
        massage = "Ви програли :(";
    }

    winText.textContent = massage;

    CurrentPlayerTurn = EMPTY;

    winDiv.classList.remove("hidden");
}

function ResetGame() {
    squares = [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY];

    for (let i = 0; i < elements.length; i++) {
        const item = elements[i];

        item.classList.remove("square-button-scale");
        item.classList.remove("x-button");
        item.classList.remove("o-button");
    }

    winDiv.classList.add("hidden");
    CurrentPlayerTurn = PLAYER_X;
}

function CompleteTurn(array, index, player){
    array[index] = player;
    playSound();
}

for (let i = 0; i < elements.length; i++) {
    const item = elements[i];
    item.addEventListener("click", function () {
        if (CurrentPlayerTurn === PLAYER_X){
            CompleteTurn(squares, i, PLAYER_X);

            item.classList.add("x-button");
            CurrentPlayerTurn = PLAYER_O;

            setTimeout(() => ComputerTurn(squares, elements), 500);

            DisplayGameOverMassage(CheckForWinCondition(squares));
            
        }
    });
}
