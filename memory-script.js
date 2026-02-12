document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const memoryMessage = document.getElementById('memory-message');
    const memoryScoreDisplay = document.getElementById('memory-score');
    const memoryResultDisplay = document.getElementById('memory-result');
    const gridSizeSelect = document.getElementById('grid-size');
    const attemptCountInput = document.getElementById('attempt-count');
    const recallTimeLimitInput = document.getElementById('recall-time-limit');

    let gridSize = 5;
    let numToHighlight = 0;
    let displayTime = 1500;
    let gamePhase = 'ready';
    let highlightedSquares = [];
    let clickedSquares = new Set();
    let score = 0;
    let roundCorrect = 0;
    let roundIncorrect = 0;

    let totalAttempts = 1;
    let currentAttempt = 0;
    let allAttemptsResults = [];

    let recallDuration = 5;
    let recallTimer;
    let timeRemaining;

    if (!gameBoard || !memoryMessage || !memoryScoreDisplay || !memoryResultDisplay || !gridSizeSelect || !attemptCountInput || !recallTimeLimitInput) {
        console.error('One or more required elements for Visual Memory Test not found.');
        return;
    }

    const HIGHLIGHT_COUNTS = {
        3: { min: 2, max: 4 },
        5: { min: 4, max: 7 },
        7: { min: 7, max: 12 }
    };

    function resetRound() {
        gamePhase = 'ready';
        highlightedSquares = [];
        clickedSquares.clear();
        roundCorrect = 0;
        roundIncorrect = 0;
        gameBoard.innerHTML = '';
        gameBoard.classList.remove('active');
        memoryScoreDisplay.textContent = `현재 점수: ${score}`;
        clearInterval(recallTimer);
        memoryResultDisplay.innerHTML = '';
    }

    function resetGame() {
        resetRound();
        score = 0;
        currentAttempt = 0;
        allAttemptsResults = [];
        memoryMessage.textContent = '클릭하여 시작';
        gridSizeSelect.disabled = false;
        attemptCountInput.disabled = false;
        recallTimeLimitInput.disabled = false;
        memoryResultDisplay.innerHTML = '';
    }

    function generateGrid() {
        gameBoard.innerHTML = '';
        gameBoard.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        for (let i = 0; i < gridSize * gridSize; i++) {
            const square = document.createElement('div');
            square.classList.add('grid-square');
            square.dataset.index = i;
            gameBoard.appendChild(square);
        }
    }

    function getHighlightCount(grid) {
        const config = HIGHLIGHT_COUNTS[grid] || { min: 4, max: 4 };
        return Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
    }

    function startNewRound() {
        gameBoard.querySelectorAll('.grid-square').forEach(sq => {
            sq.classList.remove('highlight', 'correct', 'incorrect');
        });

        gridSize = parseInt(gridSizeSelect.value, 10);
        numToHighlight = getHighlightCount(gridSize);
        clickedSquares.clear();
        roundCorrect = 0;
        roundIncorrect = 0;

        gamePhase = 'memorizing';
        gridSizeSelect.disabled = true;
        attemptCountInput.disabled = true;
        recallTimeLimitInput.disabled = true;
        memoryMessage.textContent = `시도 ${currentAttempt}/${totalAttempts}: 기억하세요...`;

        generateGrid();
        gameBoard.classList.add('active');

        const allIndices = Array.from({ length: gridSize * gridSize }, (_, i) => i);
        highlightedSquares = [];
        for (let i = 0; i < numToHighlight; i++) {
            const randomIndex = Math.floor(Math.random() * allIndices.length);
            highlightedSquares.push(allIndices.splice(randomIndex, 1)[0]);
        }

        highlightedSquares.forEach(index => {
            gameBoard.children[index].classList.add('highlight');
        });

        setTimeout(() => {
            highlightedSquares.forEach(index => {
                gameBoard.children[index].classList.remove('highlight');
            });
            gamePhase = 'recalling';
            timeRemaining = recallDuration;
            startRecallTimer();
        }, displayTime);
    }

    function startRecallTimer() {
        memoryMessage.textContent = `시도 ${currentAttempt}/${totalAttempts}: 클릭하세요! 남은 시간: ${timeRemaining}초`;
        recallTimer = setInterval(() => {
            timeRemaining--;
            if (timeRemaining >= 0) {
                memoryMessage.textContent = `시도 ${currentAttempt}/${totalAttempts}: 클릭하세요! 남은 시간: ${timeRemaining}초`;
            }
            if (timeRemaining <= 0) {
                clearInterval(recallTimer);
                endRound(true);
            }
        }, 1000);
    }

    function handleSquareClick(event) {
        if (gamePhase !== 'recalling') return;

        const clickedSquareElement = event.target;
        if (!clickedSquareElement.classList.contains('grid-square')) return;

        const index = parseInt(clickedSquareElement.dataset.index, 10);
        if (clickedSquares.has(index)) return;

        clickedSquares.add(index);

        if (highlightedSquares.includes(index)) {
            roundCorrect++;
            score += 10;
            clickedSquareElement.classList.add('correct');
        } else {
            roundIncorrect++;
            score = Math.max(0, score - 5);
            clickedSquareElement.classList.add('incorrect');
        }
        memoryScoreDisplay.textContent = `현재 점수: ${score}`;

        if (clickedSquares.size === numToHighlight) {
            clearInterval(recallTimer);
            setTimeout(endRound, 500);
        }
    }

    function endRound(timeRanOut = false) {
        clearInterval(recallTimer);
        gameBoard.classList.remove('active');

        if (timeRanOut || clickedSquares.size < numToHighlight) {
            highlightedSquares.forEach(index => {
                if (!clickedSquares.has(index)) {
                    const squareElement = gameBoard.children[index];
                    if (!squareElement.classList.contains('correct') && !squareElement.classList.contains('incorrect')) {
                        squareElement.classList.add('incorrect');
                        roundIncorrect++;
                        score = Math.max(0, score - 5);
                    }
                }
            });
            memoryScoreDisplay.textContent = `현재 점수: ${score}`;
        }

        allAttemptsResults.push({
            attempt: currentAttempt,
            score: score,
            correct: roundCorrect,
            incorrect: roundIncorrect,
            highlighted: numToHighlight
        });

        if (currentAttempt < totalAttempts) {
            currentAttempt++;
            setTimeout(startNewRound, 1500);
        } else {
            endGame();
        }
    }

    function startGameFlow() {
        const attempts = AppUtils.validatePositiveInt(attemptCountInput.value, '시도 횟수');
        if (attempts === null) return;
        totalAttempts = attempts;

        const recall = AppUtils.validatePositiveInt(recallTimeLimitInput.value, '기억 시간');
        if (recall === null) return;
        recallDuration = recall;

        resetGame();
        currentAttempt = 1;
        startNewRound();
    }

    function getMemoryGrade(finalScore, totalHighlighted, totalIncorrect) {
        const potentialMaxScore = totalHighlighted * 10;
        if (totalIncorrect === 0 && finalScore === potentialMaxScore) return 'S';
        if (finalScore >= potentialMaxScore * 0.8 && totalIncorrect < totalHighlighted * 0.1) return 'A';
        if (finalScore >= potentialMaxScore * 0.6 && totalIncorrect < totalHighlighted * 0.2) return 'B';
        if (finalScore >= potentialMaxScore * 0.4) return 'C';
        return 'D';
    }

    function endGame() {
        gamePhase = 'finished';
        gameBoard.classList.remove('active');
        clearInterval(recallTimer);

        const finalScore = allAttemptsResults.reduce((sum, res) => sum + res.score, 0);
        const totalCorrect = allAttemptsResults.reduce((sum, res) => sum + res.correct, 0);
        const totalIncorrect = allAttemptsResults.reduce((sum, res) => sum + res.incorrect, 0);
        const totalHighlighted = allAttemptsResults.reduce((sum, res) => sum + res.highlighted, 0);

        const grade = getMemoryGrade(finalScore, totalHighlighted, totalIncorrect);

        memoryResultDisplay.innerHTML = `
            <h2>테스트 종료!</h2>
            <p>최종 점수: ${finalScore}</p>
            <p>총 정답: ${totalCorrect}개</p>
            <p>총 오답: ${totalIncorrect}개</p>
            <p>난이도: ${gridSize}x${gridSize} 격자</p>
            <h3>등급: ${grade}</h3>
        `;

        const newResult = {
            ...AppUtils.createBaseResult('memory'),
            grade: grade,
            finalScore: finalScore,
            totalCorrectClicks: totalCorrect,
            totalIncorrectClicks: totalIncorrect,
            totalHighlighted: totalHighlighted,
            gridSize: gridSize,
            totalAttempts: totalAttempts,
            recallDuration: recallDuration,
            attemptDetails: allAttemptsResults
        };

        AppUtils.saveTestResult('bestMemoryTestResult', newResult, (newR, bestR) => {
            return newR.finalScore > bestR.finalScore;
        });

        memoryMessage.textContent = '결과 페이지로 이동 중...';
        AppUtils.navigateToResults();
    }

    gameBoard.addEventListener('click', handleSquareClick);
    memoryMessage.addEventListener('click', () => {
        if (gamePhase === 'ready' || gamePhase === 'finished') {
            startGameFlow();
        }
    });

    // Initial setup
    resetGame();
    generateGrid();
    memoryMessage.textContent = '클릭하여 시작';
});
