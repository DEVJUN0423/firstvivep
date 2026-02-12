document.addEventListener('DOMContentLoaded', () => {
    const gameArea = document.getElementById('game-area');
    const accuracyScoreDisplay = document.getElementById('accuracy-score');
    const accuracyTimerDisplay = document.getElementById('accuracy-timer');
    const accuracyResultsDisplay = document.getElementById('accuracy-results');
    const startButton = document.querySelector('.start-accuracy-button');
    const accuracyMessage = document.getElementById('accuracy-message');
    const gameDurationInput = document.getElementById('game-duration-input');

    if (!gameArea || !accuracyScoreDisplay || !accuracyTimerDisplay || !accuracyResultsDisplay || !startButton || !gameDurationInput || !accuracyMessage) {
        console.error('One or more required elements for Accuracy Test not found.');
        return;
    }

    const DIFFICULTY_CONFIG = {
        easy:   { targetSize: 70, timeout: 2000, spawnDelay: 1200 },
        normal: { targetSize: 50, timeout: 1500, spawnDelay: 1000 },
        hard:   { targetSize: 30, timeout: 1000, spawnDelay: 800 }
    };

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

        gameArea.querySelectorAll('.target').forEach(t => t.remove());

        const target = document.createElement('div');
        target.classList.add('target');
        target.style.width = `${targetSize}px`;
        target.style.height = `${targetSize}px`;

        const rect = gameArea.getBoundingClientRect();
        const maxX = rect.width - targetSize;
        const maxY = rect.height - targetSize;

        target.style.left = maxX > 0 ? `${Math.random() * maxX}px` : '0px';
        target.style.top = maxY > 0 ? `${Math.random() * maxY}px` : '0px';

        const targetCreationTime = AppUtils.now();
        target.addEventListener('click', (event) => {
            event.stopPropagation();
            if (!gameRunning) return;

            hitReactionTimes.push(Math.round(AppUtils.now() - targetCreationTime));
            hits++;
            score += 10;
            updateScore();
            target.remove();
            clearTimeout(targetTimeout);
            spawnNextTarget();
        });
        gameArea.appendChild(target);

        targetTimeout = setTimeout(() => {
            if (!gameRunning) return;
            misses++;
            updateScore();
            target.remove();
            spawnNextTarget();
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

    function getAccuracyGrade(accuracy, avgReactionTime) {
        const gradeScore = (accuracy * 10) + Math.max(0, 500 - avgReactionTime);
        const thresholds = [
            { threshold: 1200, grade: 'S' },
            { threshold: 1000, grade: 'A' },
            { threshold: 800,  grade: 'B' },
            { threshold: 600,  grade: 'C' },
            { threshold: 400,  grade: 'D' }
        ];
        return AppUtils.getGrade(thresholds, gradeScore, 'F', false);
    }

    function endGame() {
        gameRunning = false;
        clearInterval(gameInterval);
        clearTimeout(targetTimeout);
        gameArea.querySelectorAll('.target').forEach(t => t.remove());

        const totalClicks = hits + misses;
        const accuracy = totalClicks > 0 ? (hits / totalClicks * 100).toFixed(2) : 0;
        const avgReactionTime = hitReactionTimes.length > 0
            ? hitReactionTimes.reduce((a, b) => a + b, 0) / hitReactionTimes.length
            : 0;
        const grade = getAccuracyGrade(accuracy, avgReactionTime);

        accuracyResultsDisplay.innerHTML = `
            <h2>게임 종료!</h2>
            <p>최종 점수: ${score}</p>
            <p>명중률: ${accuracy}%</p>
            <p>평균 반응 시간: ${avgReactionTime.toFixed(2)}ms</p>
            <h3>등급: ${grade}</h3>
        `;

        const newResult = {
            ...AppUtils.createBaseResult('accuracy'),
            grade: grade,
            score: score,
            accuracy: accuracy,
            avgReactionTime: avgReactionTime.toFixed(2),
            reactionTimes: hitReactionTimes,
            difficulty: currentDifficulty
        };

        AppUtils.saveTestResult('bestAccuracyTestResult', newResult, (newR, bestR) => {
            return newR.score > bestR.score;
        });

        accuracyMessage.textContent = '결과 페이지로 이동 중...';
        startButton.textContent = '다시 시작';
        startButton.disabled = false;

        AppUtils.navigateToResults();
    }

    function startGame() {
        const duration = AppUtils.validatePositiveInt(gameDurationInput.value, '게임 시간');
        if (duration === null) return;
        gameDuration = duration;

        const selectedDifficulty = document.querySelector('input[name="difficulty"]:checked').value;
        currentDifficulty = selectedDifficulty;

        const config = DIFFICULTY_CONFIG[currentDifficulty];
        targetSize = config.targetSize;
        targetTimeoutDuration = config.timeout;
        spawnDelay = config.spawnDelay;

        score = 0;
        hits = 0;
        misses = 0;
        timer = 0;
        hitReactionTimes = [];
        gameRunning = true;
        accuracyResultsDisplay.innerHTML = '';
        accuracyMessage.textContent = '게임을 플레이 중입니다...';
        startButton.disabled = true;

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
    accuracyMessage.textContent = '클릭하여 게임 시작';
});
