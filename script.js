document.addEventListener('DOMContentLoaded', () => {
    // Game State
    let answer = [];
    let currentGuess = [];
    let history = [];
    let difficulty = 'entry';
    let remainingTries = Infinity;
    let isGameOver = false;

    // Difficulty Settings
    const difficultySettings = {
        entry: Infinity,
        easy: 15,
        medium: 10,
        expert: 6
    };

    // DOM Elements
    const digitBoxes = [
        document.getElementById('digit-0'),
        document.getElementById('digit-1'),
        document.getElementById('digit-2')
    ];
    const remainingTriesDisplay = document.getElementById('remaining-tries');
    const gameStatus = document.getElementById('game-status');
    const historyList = document.getElementById('history-list');
    const hintDisplay = document.getElementById('hint-display');
    const hintBtn = document.getElementById('hint-btn');
    const newGameBtn = document.getElementById('new-game-btn');
    const diffButtons = document.querySelectorAll('.diff-btn');
    const keys = document.querySelectorAll('.key[data-val]');
    const undoBtn = document.getElementById('undo-btn');
    const submitBtn = document.getElementById('submit-btn');

    // Initialize Game
    function initGame() {
        answer = generateAnswer();
        currentGuess = [];
        history = [];
        isGameOver = false;
        remainingTries = difficultySettings[difficulty];
        
        updateDisplay();
        updateRemainingTries();
        historyList.innerHTML = '';
        gameStatus.textContent = '新游戏开始！猜猜看？';
        gameStatus.style.color = '#666';
        hintDisplay.textContent = '';
        console.log('Answer (cheat):', answer.join('')); // For debugging
    }

    // Generate 3 unique random digits
    function generateAnswer() {
        const digits = Array.from({ length: 10 }, (_, i) => i);
        const result = [];
        for (let i = 0; i < 3; i++) {
            const randomIndex = Math.floor(Math.random() * digits.length);
            result.push(digits.splice(randomIndex, 1)[0]);
        }
        return result;
    }

    // Update the 3-digit display
    function updateDisplay() {
        digitBoxes.forEach((box, i) => {
            box.textContent = currentGuess[i] !== undefined ? currentGuess[i] : '';
            box.style.borderColor = currentGuess[i] !== undefined ? '#4a90e2' : '#ddd';
        });
    }

    function updateRemainingTries() {
        remainingTriesDisplay.textContent = remainingTries === Infinity ? '∞' : remainingTries;
    }

    // AxBy Calculation
    function calculateResult(guess, target) {
        let a = 0;
        let b = 0;
        guess.forEach((digit, i) => {
            if (digit === target[i]) {
                a++;
            } else if (target.includes(digit)) {
                b++;
            }
        });
        return { a, b };
    }

    // Handle Virtual Keyboard Input
    function handleInput(val) {
        if (isGameOver || currentGuess.length >= 3) return;
        if (currentGuess.includes(val)) {
            gameStatus.textContent = '不能输入重复数字！';
            gameStatus.style.color = '#dc3545';
            return;
        }
        currentGuess.push(parseInt(val));
        updateDisplay();
        gameStatus.textContent = '';
    }

    function handleUndo() {
        if (isGameOver || currentGuess.length === 0) return;
        currentGuess.pop();
        updateDisplay();
        gameStatus.textContent = '';
    }

    // Submit Guess
    function handleSubmit() {
        if (isGameOver) return;
        if (currentGuess.length < 3) {
            gameStatus.textContent = '请输入3位数字！';
            gameStatus.style.color = '#dc3545';
            return;
        }

        const result = calculateResult(currentGuess, answer);
        const guessStr = currentGuess.join('');
        const resultStr = `A${result.a}B${result.b}`;
        
        history.push({ guess: [...currentGuess], result: resultStr });
        addHistoryItem(guessStr, resultStr);

        if (result.a === 3) {
            endGame(true);
        } else {
            if (remainingTries !== Infinity) {
                remainingTries--;
                updateRemainingTries();
                if (remainingTries <= 0) {
                    endGame(false);
                }
            }
        }

        if (!isGameOver) {
            currentGuess = [];
            updateDisplay();
        }
    }

    function addHistoryItem(guess, result) {
        const li = document.createElement('li');
        li.className = 'history-item';
        if (result === 'A3B0') li.classList.add('win');
        li.innerHTML = `
            <span class="guess-val">${guess}</span>
            <span class="result-val">${result}</span>
        `;
        historyList.prepend(li);
    }

    function endGame(win) {
        isGameOver = true;
        if (win) {
            gameStatus.textContent = '恭喜你，猜对了！';
            gameStatus.style.color = '#28a745';
        } else {
            gameStatus.textContent = `游戏结束！正确答案是 ${answer.join('')}`;
            gameStatus.style.color = '#dc3545';
            const li = document.createElement('li');
            li.className = 'history-item lose';
            li.innerHTML = `<span>正确答案</span><span>${answer.join('')}</span>`;
            historyList.prepend(li);
        }
    }

    // Hint System: Filter all possible answers
    function getPossibleAnswers() {
        const allPossible = [];
        for (let i = 0; i <= 9; i++) {
            for (let j = 0; j <= 9; j++) {
                if (j === i) continue;
                for (let k = 0; k <= 9; k++) {
                    if (k === i || k === j) continue;
                    allPossible.push([i, j, k]);
                }
            }
        }

        return allPossible.filter(candidate => {
            return history.every(record => {
                const res = calculateResult(record.guess, candidate);
                return `A${res.a}B${res.b}` === record.result;
            });
        });
    }

    function handleHint() {
        if (isGameOver) return;
        const possible = getPossibleAnswers();
        if (possible.length === 0) {
            hintDisplay.textContent = '出错了，没有符合条件的数字。';
            return;
        }

        // Pick a random one from possible candidates
        const hint = possible[Math.floor(Math.random() * possible.length)];
        currentGuess = [...hint];
        updateDisplay();
        hintDisplay.textContent = `提示：试试 ${hint.join('')}。符合条件的组合还有 ${possible.length} 个。`;
    }

    // Event Listeners
    keys.forEach(key => {
        key.addEventListener('click', () => handleInput(key.dataset.val));
    });

    undoBtn.addEventListener('click', handleUndo);
    submitBtn.addEventListener('click', handleSubmit);
    hintBtn.addEventListener('click', handleHint);
    newGameBtn.addEventListener('click', initGame);

    diffButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            diffButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            difficulty = btn.dataset.difficulty;
            initGame();
        });
    });

    // Keyboard support (Physical)
    document.addEventListener('keydown', (e) => {
        if (e.key >= '0' && e.key <= '9') {
            handleInput(e.key);
        } else if (e.key === 'Backspace') {
            handleUndo();
        } else if (e.key === 'Enter') {
            handleSubmit();
        }
    });

    // Start initial game
    initGame();
});
