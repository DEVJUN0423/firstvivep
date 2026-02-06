document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const memoryMessage = document.getElementById('memory-message');
    const memoryScoreDisplay = document.getElementById('memory-score');
    const memoryResultDisplay = document.getElementById('memory-result');
    const gridSizeSelect = document.getElementById('grid-size');
    const attemptCountInput = document.getElementById('attempt-count');
    const recallTimeLimitInput = document.getElementById('recall-time-limit'); // New

    let gridSize = 5; // Default to Normal (5x5)
    let numToHighlight = 0; // Will be randomized per round
    let displayTime = 1500; // ms
    let gamePhase = 'ready'; // 'ready', 'memorizing', 'recalling', 'finished'
    let highlightedSquares = [];
    let clickedSquares = new Set(); // To track squares clicked in current round
    let score = 0;
    let roundCorrect = 0;
    let roundIncorrect = 0;

    let totalAttempts = 1;
    let currentAttempt = 0;
    let allAttemptsResults = []; // Stores score per attempt

    let recallDuration = 5; // seconds, new
    let recallTimer; // new
    let timeRemaining; // new

    if (!gameBoard || !memoryMessage || !memoryScoreDisplay || !memoryResultDisplay || !gridSizeSelect || !attemptCountInput || !recallTimeLimitInput) {
        console.error('One or more required elements for Visual Memory Test not found. Script may not function correctly.');
        return;
    }

    function resetRound() {
        gamePhase = 'ready';
        highlightedSquares = [];
        clickedSquares.clear();
        roundCorrect = 0;
        roundIncorrect = 0;
        gameBoard.innerHTML = ''; // Clear grid
        gameBoard.classList.remove('active');
        memoryScoreDisplay.textContent = `현재 점수: ${score}`;
        clearInterval(recallTimer); // Ensure timer is cleared on reset
    }

    function resetGame() {
        resetRound();
        score = 0;
        currentAttempt = 0;
        allAttemptsResults = [];
        memoryResultDisplay.textContent = '';
        memoryMessage.textContent = '클릭하여 시작';
        gridSizeSelect.disabled = false;
        attemptCountInput.disabled = false;
        recallTimeLimitInput.disabled = false; // New
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
        switch (grid) {
            case 3: return Math.floor(Math.random() * (4 - 2 + 1)) + 2; // Easy: 2-4
            case 5: return Math.floor(Math.random() * (7 - 4 + 1)) + 4; // Normal: 4-7
            case 7: return Math.floor(Math.random() * (12 - 7 + 1)) + 7; // Hard: 7-12
            default: return 4;
        }
    }

    function startNewRound() {
        gridSize = parseInt(gridSizeSelect.value, 10);
        numToHighlight = getHighlightCount(gridSize);
        clickedSquares.clear();
        roundCorrect = 0;
        roundIncorrect = 0;
        
        gamePhase = 'memorizing';
        gridSizeSelect.disabled = true;
        attemptCountInput.disabled = true;
        recallTimeLimitInput.disabled = true; // New
        memoryMessage.textContent = `시도 ${currentAttempt}/${totalAttempts}: 기억하세요...`;
        
        generateGrid();
        gameBoard.classList.add('active');

        const allSquares = Array.from({ length: gridSize * gridSize }, (_, i) => i);
        highlightedSquares = [];
        for (let i = 0; i < numToHighlight; i++) {
            const randomIndex = Math.floor(Math.random() * allSquares.length);
            highlightedSquares.push(allSquares.splice(randomIndex, 1)[0]);
        }

        highlightedSquares.forEach(index => {
            gameBoard.children[index].classList.add('highlight');
        });

        setTimeout(() => {
            highlightedSquares.forEach(index => {
                gameBoard.children[index].classList.remove('highlight');
            });
            gamePhase = 'recalling';
            timeRemaining = recallDuration; // New
            startRecallTimer(); // New
        }, displayTime);
    }

    function startRecallTimer() { // New function
        memoryMessage.textContent = `시도 ${currentAttempt}/${totalAttempts}: 클릭하세요! 남은 시간: ${timeRemaining}초`;
        recallTimer = setInterval(() => {
            timeRemaining--;
            if (timeRemaining >= 0) {
                memoryMessage.textContent = `시도 ${currentAttempt}/${totalAttempts}: 클릭하세요! 남은 시간: ${timeRemaining}초`;
            }
            if (timeRemaining <= 0) {
                clearInterval(recallTimer);
                endRound(true); // Indicate time ran out
            }
        }, 1000);
    }

    function handleSquareClick(event) {
        if (gamePhase !== 'recalling') return;

        const clickedSquare = event.target;
        if (!clickedSquare.classList.contains('grid-square') || clickedSquares.has(clickedSquare)) return;

        const index = parseInt(clickedSquare.dataset.index, 10);
        clickedSquares.add(clickedSquare); // Mark as clicked in this round

        if (highlightedSquares.includes(index)) {
            roundCorrect++;
            score += 10;
            clickedSquare.classList.add('correct');
        } else {
            roundIncorrect++;
            score = Math.max(0, score - 5); 
            clickedSquare.classList.add('incorrect');
        }
        memoryScoreDisplay.textContent = `현재 점수: ${score}`;

        if (clickedSquares.size >= numToHighlight) { // User has clicked enough squares for this round
            clearInterval(recallTimer); // New: stop timer if all expected clicks are made
            // Give a small delay to see the last click
            setTimeout(endRound, 500); 
        }
    }

    function endRound(timeRanOut = false) { // Modified to accept timeRanOut
        clearInterval(recallTimer); // New: ensure timer is cleared
        gameBoard.classList.remove('active'); // Disable further clicks for this round

        // Calculate additional incorrect squares if time ran out
        if (timeRanOut) {
            const unclickedHighlighted = highlightedSquares.filter(index => {
                // Check if the original highlighted square was NOT clicked
                return !Array.from(clickedSquares).some(clickedSq => parseInt(clickedSq.dataset.index) === index);
            });
            roundIncorrect += unclickedHighlighted.length;
            score = Math.max(0, score - (unclickedHighlighted.length * 5)); // Penalize for missed squares
            memoryScoreDisplay.textContent = `현재 점수: ${score}`;
            
            // Visually mark unclicked highlighted squares as missed
            unclickedHighlighted.forEach(index => {
                const square = gameBoard.children[index];
                if (!square.classList.contains('correct') && !square.classList.contains('incorrect')) {
                    square.classList.add('incorrect'); // Mark as incorrect if not already handled
                }
            });
        }

        // Ensure all highlighted squares are revealed if not clicked (for visual feedback)
        highlightedSquares.forEach(index => {
            const square = gameBoard.children[index];
            if (!square.classList.contains('correct') && !square.classList.contains('incorrect')) {
                 square.classList.add('highlight'); // Show original highlight if missed
            }
        });
        
        allAttemptsResults.push({
            attempt: currentAttempt,
            score: score, // Score at the end of this attempt
            correct: roundCorrect,
            incorrect: roundIncorrect,
            highlighted: numToHighlight
        });

        if (currentAttempt < totalAttempts) {
            currentAttempt++;
            setTimeout(startNewRound, 1500); // Small pause before next round
        } else {
            endGame();
        }
    }

    function startGameFlow() {
        totalAttempts = parseInt(attemptCountInput.value, 10);
        if (isNaN(totalAttempts) || totalAttempts < 1) {
            alert('유효한 시도 횟수를 입력하세요 (1 이상의 숫자).');
            return;
        }

        recallDuration = parseInt(recallTimeLimitInput.value, 10); // New: get recall duration
        if (isNaN(recallDuration) || recallDuration < 1) {
            alert('유효한 기억 시간을 입력하세요 (1 이상의 숫자).');
            return;
        }

        resetGame(); // Full reset
        currentAttempt = 1; // Start first attempt
        startNewRound();
    }

    function endGame() {
        gamePhase = 'finished';
        gameBoard.classList.remove('active');
        clearInterval(recallTimer); // Ensure timer is cleared at game end

        // Aggregate results
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
            id: new Date().getTime(),
            date: new Date().toLocaleString(),
            type: 'memory', // Add type for generic handling
            grade: grade,
            finalScore: finalScore,
            totalCorrectClicks: totalCorrect,
            totalIncorrectClicks: totalIncorrect,
            totalHighlighted: totalHighlighted,
            gridSize: gridSize,
            totalAttempts: totalAttempts,
            recallDuration: recallDuration, // New: save recall duration
            attemptDetails: allAttemptsResults // Keep details of each attempt
        };

        // Save current result for immediate feedback on the results page
        localStorage.setItem('currentTestResult', JSON.stringify(newResult));

        let bestMemoryResult = JSON.parse(localStorage.getItem('bestMemoryTestResult'));

        // Higher score is better
        if (!bestMemoryResult || newResult.finalScore > bestMemoryResult.finalScore) {
            localStorage.setItem('bestMemoryTestResult', JSON.stringify(newResult));
        }

        memoryMessage.textContent = '결과 페이지로 이동 중...';

        document.body.classList.add('fade-out');
        setTimeout(() => {
            window.location.href = 'results.html';
        }, 500);
    }

    function getMemoryGrade(finalScore, totalHighlighted, totalIncorrect) {
        const potentialMaxScore = totalHighlighted * 10; 
        if (totalIncorrect === 0 && finalScore === potentialMaxScore) return 'S';
        if (finalScore >= potentialMaxScore * 0.8 && totalIncorrect < totalHighlighted * 0.1) return 'A';
        if (finalScore >= potentialMaxScore * 0.6 && totalIncorrect < totalHighlighted * 0.2) return 'B';
        if (finalScore >= potentialMaxScore * 0.4) return 'C';
        return 'D';
    }

    gameBoard.addEventListener('click', handleSquareClick);
    memoryMessage.addEventListener('click', () => {
        if (gamePhase === 'ready' || gamePhase === 'finished') {
            startGameFlow();
        }
    });
    
    // Initial setup
    resetGame();
    generateGrid(); // Generate initial grid based on default settings
});