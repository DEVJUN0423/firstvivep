document.addEventListener('DOMContentLoaded', () => {
    const gameArea = document.getElementById('game-area');
    const accuracyScoreDisplay = document.getElementById('accuracy-score');
    const accuracyTimerDisplay = document.getElementById('accuracy-timer');
    const accuracyResultsDisplay = document.getElementById('accuracy-results');
    const startButton = document.querySelector('.start-accuracy-button'); // Changed selector from gameArea.querySelector
    const accuracyMessage = document.getElementById('accuracy-message'); // New

    const gameDurationInput = document.getElementById('game-duration-input');

    if (!gameArea || !accuracyScoreDisplay || !accuracyTimerDisplay || !accuracyResultsDisplay || !startButton || !gameDurationInput || !accuracyMessage) {
        console.error('One or more required elements for Accuracy Test not found. Script may not function correctly.');
        return;
    }

    let score = 0;
    let hits = 0;
    let misses = 0;
    let timer = 0;
    let gameInterval;
    let targetTimeout;
    let gameRunning = false;

    let currentDifficulty = 'normal';
    let gameDuration = 30;
    let targetSize = 50;
    let targetTimeoutDuration = 1500;
    let spawnDelay = 1000;

    let hitReactionTimes = [];

    function createTarget() {
        if (!gameRunning) return;

        gameArea.querySelectorAll('.target').forEach(target => target.remove());

        const target = document.createElement('div');
        target.classList.add('target');
        target.style.width = `${targetSize}px`;
        target.style.height = `${targetSize}px`;
        
        const gameAreaRect = gameArea.getBoundingClientRect();
        const maxX = gameAreaRect.width - targetSize;
        const maxY = gameAreaRect.height - targetSize;

        if (maxX <= 0 || maxY <= 0) {
            target.style.left = '0px';
            target.style.top = '0px';
        } else {
            target.style.left = `${Math.random() * maxX}px`;
            target.style.top = `${Math.random() * maxY}px`;
        }
        
        const targetCreationTime = new Date().getTime();
        target.addEventListener('click', (event) => {
            event.stopPropagation();
            if (gameRunning) {
                const reactionTime = new Date().getTime() - targetCreationTime;
                hitReactionTimes.push(reactionTime);
                hits++;
                score += 10;
                updateScore();
                target.remove();
                clearTimeout(targetTimeout);
                spawnNextTarget();
            }
        });
        gameArea.appendChild(target);

        targetTimeout = setTimeout(() => {
            if (gameRunning) {
                misses++;
                updateScore();
                target.remove();
                spawnNextTarget();
            }
        }, targetTimeoutDuration);
    }

    function spawnNextTarget() {
        if (gameRunning) {
            setTimeout(createTarget, spawnDelay);
        }
    }

    function updateScore() {
        accuracyScoreDisplay.textContent = `점수: ${score} (명중: ${hits}, 놓침: ${misses})`;
    }

    function updateTimer() {
        accuracyTimerDisplay.textContent = `시간: ${gameDuration - timer}초`;
    }

    function endGame() {
        gameRunning = false;
        clearInterval(gameInterval);
        clearTimeout(targetTimeout);
        gameArea.querySelectorAll('.target').forEach(target => target.remove());

        const totalClicks = hits + misses;
        const accuracy = totalClicks > 0 ? (hits / totalClicks * 100).toFixed(2) : 0;
        const avgReactionTime = hitReactionTimes.length > 0 ? (hitReactionTimes.reduce((a, b) => a + b, 0) / hitReactionTimes.length) : 0;
        const grade = getAccuracyGrade(accuracy, avgReactionTime);

        accuracyResultsDisplay.innerHTML = `
            <h2>게임 종료!</h2>
            <p>최종 점수: ${score}</p>
            <p>명중률: ${accuracy}%</p>
            <p>평균 반응 시간: ${avgReactionTime.toFixed(2)}ms</p>
            <h3>등급: ${grade}</h3>
        `;
        
        const newResult = {
            id: new Date().getTime(),
            date: new Date().toLocaleString(),
            type: 'accuracy',
            grade: grade,
            score: score,
            accuracy: accuracy,
            avgReactionTime: avgReactionTime.toFixed(2),
            reactionTimes: hitReactionTimes,
            difficulty: currentDifficulty
        };

        localStorage.setItem('currentTestResult', JSON.stringify(newResult));
        
        let bestAccuracyResult = JSON.parse(localStorage.getItem('bestAccuracyTestResult'));

        if (!bestAccuracyResult || newResult.score > bestAccuracyResult.score) {
            localStorage.setItem('bestAccuracyTestResult', JSON.stringify(newResult));
        }
        
        accuracyMessage.textContent = '결과 페이지로 이동 중...'; // New: update message
        startButton.textContent = '다시 시작'; // New: update button text
        startButton.disabled = false; // New: enable start button

        document.body.classList.add('fade-out');
        setTimeout(() => {
            window.location.href = 'results.html';
        }, 500);
    }
    
    function getAccuracyGrade(accuracy, avgReactionTime) {
        const score = (accuracy * 10) + Math.max(0, 500 - avgReactionTime);
        if (score > 1200) return 'S';
        if (score > 1000) return 'A';
        if (score > 800) return 'B';
        if (score > 600) return 'C';
        if (score > 400) return 'D';
        return 'F';
    }

    function startGame() {
        gameDuration = parseInt(gameDurationInput.value, 10);
        if (isNaN(gameDuration) || gameDuration <= 0) {
            alert('유효한 게임 시간을 입력하세요 (양의 정수).');
            return;
        }

        const selectedDifficulty = document.querySelector('input[name="difficulty"]:checked').value;
        currentDifficulty = selectedDifficulty;

        switch (currentDifficulty) {
            case 'easy':
                targetSize = 70;
                targetTimeoutDuration = 2000;
                spawnDelay = 1200;
                break;
            case 'normal':
                targetSize = 50;
                targetTimeoutDuration = 1500;
                spawnDelay = 1000;
                break;
            case 'hard':
                targetSize = 30;
                targetTimeoutDuration = 1000;
                spawnDelay = 800;
                break;
        }

        score = 0;
        hits = 0;
        misses = 0;
        timer = 0;
        hitReactionTimes = [];
        gameRunning = true;
        accuracyResultsDisplay.innerHTML = '';
        accuracyMessage.textContent = '게임을 플레이 중입니다...'; // New: update message
        startButton.disabled = true; // New: disable start button

        updateScore();
        updateTimer();
        spawnNextTarget();

        gameInterval = setInterval(() => {
            timer++;
            updateTimer();
            if (timer >= gameDuration) {
                endGame();
            }
        }, 1000);
    }

    startButton.addEventListener('click', startGame);

    gameArea.addEventListener('click', (event) => {
        if (gameRunning && event.target === gameArea) {
            misses++;
            updateScore();
        }
    });

    // Initial setup
    updateScore();
    updateTimer();
    accuracyMessage.textContent = '클릭하여 게임 시작'; // Initial message
});
