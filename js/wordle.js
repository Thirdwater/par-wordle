(function() {
    'use strict';

    const Fill = Object.freeze({
        BLACK: Symbol("b"),  // we use black instead of grey just so we can distinguish it from green (e.g. bygbb)
        YELLOW: Symbol("y"),
        GREEN: Symbol("g"),
    });

    const State = Object.freeze({
        ON_GOING: Symbol("on going"),
        LOST: Symbol("lost"),
        WON: Symbol("won"),
    });

    function setToOneOrIncrement(map, key) {
        var newCount = 1;
        if (map.has(key)) {
            newCount += map.get(key);
        }
        map.set(key, newCount);
    }

    class WordleGame {
        constructor(answer) {
            this.state = State.ON_GOING;
            this.answer = answer;
            this.currentRow = 1;
            this.guesses = [];
            this.results = [];
            this.answerLetterCounts = this.countLetters(answer);

            // Aggregate hints from all guesses so far
            this.blacks = [];
            this.yellows = new Map();
            for (var i = 0; i < 5; i++) {
                this.yellows.set(i, []);
            }
            this.greens = Array(5).fill("");
            this.maxGreenYellowCounts = new Map();
        }

        isValidGuess(guess) {
            return true;
        }

        addGuess(guess) {
            if (this.state !== State.ON_GOING) {
                return;
            }
            console.log("\tGuessing:\t" + guess);
            this.guesses.push(guess);
            this.currentRow++;

            var guessResult = Array(5).fill(Fill.BLACK);
            var consumedLetterCounts = new Map();
            // Fill in all the correct positions first
            // Then check the wrong positions to handle repeated letters
            for (var i = 0; i < 5; i++) {
                var guessLetter = guess.charAt(i);
                var answerLetter = this.answer.charAt(i);
                if (guessLetter === answerLetter) {
                    setToOneOrIncrement(consumedLetterCounts, guessLetter);
                    guessResult[i] = Fill.GREEN;
                    if (this.greens[i] !== guessLetter) {
                        this.greens[i] = guessLetter;
                    }
                }
            }
            // Any repeated and remaining letters in the wrong position will
            // be labeled yellow from left-to-right.
            for (var i = 0; i < 5; i++) {
                if (guessResult[i] !== Fill.GREEN) {
                    var guessLetter = guess.charAt(i);
                    var hasLetter = this.answerLetterCounts.has(guessLetter);
                    var hasRemainingCount = (!consumedLetterCounts.has(guessLetter) ||
                        consumedLetterCounts.get(guessLetter) < this.answerLetterCounts.get(guessLetter));
                    if (hasLetter && hasRemainingCount) {
                        setToOneOrIncrement(consumedLetterCounts, guessLetter);
                        guessResult[i] = Fill.YELLOW;
                        if (!this.yellows.get(i).includes(guessLetter)) {
                            this.yellows.get(i).push(guessLetter);
                        }
                    } else {
                        if (!this.blacks.includes(guessLetter)) {
                            this.blacks.push(guessLetter);
                        }
                    }
                }
            }
            this.results.push(guessResult);

            // Update max letter count
            var tmpCount = new Map();
            for (var i = 0; i < 5; i++) {

            }

            // console.log(...consumedLetterCounts.entries());
            console.log("\tResult:\t\t" + guessResult.map((letterResult) => letterResult.description).join(""));

            this.getPossibleAnswers();

            this.updateState();
            return guessResult;
        }

        updateState() {
            if (this.results.length === 0) {
                this.state = State.ON_GOING;
                return;
            }
            var latestResult = this.results[this.results.length - 1];
            var won = true;
            for (var i = 0; i < 5; i++) {
                var letterResult = latestResult[i];
                if (letterResult !== Fill.GREEN) {
                    won = false;
                    break;
                }
            }
            if (won) {
                this.state = State.WON;
                return;
            }
            if (this.currentRow > 6) {
                this.state = State.LOST;
                return;
            }
            this.state = State.ON_GOING;
        }

        getPossibleAnswers() {
            console.log("\tRegex:");

            var greensYellowsPattern = "";
            for (var i = 0; i < 5; i++) {
                var greenLetter = this.greens[i];
                var yellowLetters = this.yellows.get(i);
                if (greenLetter) {
                    greensYellowsPattern += greenLetter;
                } else if (yellowLetters.length > 0) {
                    greensYellowsPattern += `[^${yellowLetters.join("")}]`;
                } else {
                    greensYellowsPattern += ".";
                }
            }

            // For each black letters that doesn't appear in green or yellow, we can safely exclude.
            var filteredBlacks = []
            this.blacks.forEach((blackLetter) => {
                // var inGreens = this.greenCounts.has(blackLetter);
                // var inYellows = this.yellowCounts.has(blackLetter);
                // if (!inGreens && !inYellows) {
                //     filteredBlacks.push(blackLetter);
                // }
            });

            var initialFilterPattern = "^";
            if (filteredBlacks.length > 0) {
                initialFilterPattern += `(?!.*[${filteredBlacks.join("")}])`;
            }
            initialFilterPattern += `${greensYellowsPattern}$`;
            var initialFilterRegExp = new RegExp(initialFilterPattern);

            console.log("\t\t1. Initial filter:");
            console.log("\t\t\tGreens:\t\t" + `[${this.greens}]`);
            // console.log("\t\t\t  Counts:\t" + `${[...this.greenCounts.entries()]}`);
            console.log("\t\t\tYellows:\t" + `${[...this.yellows.entries()]}`);
            // console.log("\t\t\t  Counts:\t" + `${[...this.yellowCounts.entries()]}`);
            console.log("\t\t\tBlacks:\t\t" + `${this.blacks}`);
            console.log("\t\t\t  Filtered:\t" + `${filteredBlacks}`);
            console.log("\t\t\tPattern:\t" + initialFilterPattern);

            // For each letter's green and yellow counts, we have at least the sum of them.
            // If that same letter also appears in black, then we also have at most that sum.

            var countFilterRegExp = new RegExp();
        }

        countLetters(word) {
            var letterCounts = new Map();
            for (var i = 0; i < 5; i++) {
                var letter = word.charAt(i);
                setToOneOrIncrement(letterCounts, letter);
            }
            return letterCounts;
        }
    }

    class Controller {
        constructor() {
            this.initialize();
            this.newGame();
        }

        initialize() {
            document.addEventListener('keydown', this.handleKeyboard);
        }

        newGame() {
            this.clearBoard();
            this.game = new WordleGame("penne");
            this.currentColumn = 1;
            this.filledRow = false;
        }

        handleKeyboard = (event) => {
            const key = event.key.toLowerCase();
            const keyIsLetter = key.length === 1 && 'a' <= key && key <= 'z';
            if (event.ctrlKey || event.altKey || event.metaKey) {
                return;
            } else if (key === 'backspace') {
                this.deleteLetter();
            } else if (keyIsLetter) {
                this.addLetter(key);
            } else if (key === 'enter') {
                this.addGuess();
            }
        }

        addGuess() {
            if (!this.filledRow) {
                return
            }
            var guess = "";
            var guessRow = this.game.currentRow;
            for (var i = 1; i <= 5; i++) {
                var cell = this.getCell(guessRow, i);
                guess += cell.innerText.toLowerCase();
            }
            if (!this.game.isValidGuess(guess)) {
                alert(`"${guess.toUpperCase()}" is not a valid guess!`)
            }
            var result = this.game.addGuess(guess);
            for (var i = 0; i < 5; i++) {
                var letterResult = result[i];
                var cell = this.getCell(guessRow, i + 1);
                cell.classList.add('filled');
                switch (letterResult) {
                    case Fill.BLACK:
                        cell.classList.add('black');
                        break;
                    case Fill.YELLOW:
                        cell.classList.add('yellow');
                        break;
                    case Fill.GREEN:
                        cell.classList.add('green');
                        break;
                }
            }
            this.currentColumn = 1;
            this.filledRow = false;
            setTimeout(this.handleUpdateState, 100);  // Allow some time for css to update
        }

        handleUpdateState = () => {
            console.log("handleUpdateState");
            if (this.game.state === State.WON) {
                alert(`Congratulations! You won!`);
                this.newGame();
            } else if (this.game.state === State.LOST) {
                alert(`You lost! The answer was "${this.game.answer.toUpperCase()}"!`);
                this.newGame();
            }
        }

        addLetter(letter) {
            if (this.filledRow) {
                return;
            }
            var cell = this.getCell(this.game.currentRow, this.currentColumn);
            cell.innerText = letter.toUpperCase();
            if (this.currentColumn == 5) {
                this.filledRow = true;
            } else {
                this.currentColumn++;
            }
        }

        deleteLetter() {
            var lastColumn = Math.max(1, this.currentColumn - 1);
            if (this.filledRow) {
                lastColumn = 5;
            }
            var cell = this.getCell(this.game.currentRow, lastColumn);
            cell.innerText = "";
            this.currentColumn = Math.max(1, this.currentColumn - 1);
            if (this.filledRow) {
                this.currentColumn = 5;
            }
            this.filledRow = false;
        }

        clearBoard() {
            for (var row = 1; row <= 6; row++) {
                for (var col = 1; col <= 5; col++) {
                    var cell = this.getCell(row, col);
                    cell.innerText = "";
                    cell.classList.remove('filled', 'grey', 'yellow', 'green');
                }
            }
        }

        getCell(row, column) {
            var cellID = `board_row_${row}_letter_${column}`;
            return document.getElementById(cellID);
        }

    }

    var controller = new Controller();
})();
