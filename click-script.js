document.addEventListener('DOMContentLoaded', () => {
    const clickArea = document.getElementById('click-area');
    const clickCountDisplay = document.getElementById('click-count');
    const clickTimerDisplay = document.getElementById('click-timer');
    const clickResultDisplay = document.getElementById('click-result');
    const gameDurationInput = document.getElementById('game-duration-input');
    const clickMessage = document.getElementById('click-message');

    let clickCount = 0;
    let timer = 0;
    let gameInterval;
    let gamePhase = 'ready'; // 'ready', 'playing', 'finished'
    let gameDuration = 5; // Default to 5 seconds

    if (!clickArea || !clickCountDisplay || !clickTimerDisplay || !clickResultDisplay || !gameDurationInput || !clickMessage) {
        console.error('One or more required elements for Click Speed Test not found. Script may not function correctly.');
        return;
    }

    function resetGame() {
        clickCount = 0;
        timer = 0;
        gamePhase = 'ready';
        clearInterval(gameInterval);
        clickCountDisplay.textContent = '클릭: 0';
        clickTimerDisplay.textContent = '시간: 0.00초';
        clickResultDisplay.textContent = '';
        clickMessage.textContent = '클릭하여 시작';
        clickArea.classList.remove('playing');
        gameDurationInput.disabled = false;
        clickArea.style.cursor = 'pointer'; // Make it clear it's clickable
    }

    function startGame() {
        gameDuration = parseInt(gameDurationInput.value, 10);
        if (isNaN(gameDuration) || gameDuration <= 0) {
            alert('유효한 테스트 시간을 입력하세요 (1 이상의 숫자).');
            return;
        }

        // Reset game state but don't reset clickMessage yet
        clickCount = 0;
        timer = 0;
        clearInterval(gameInterval);
        clickCountDisplay.textContent = '클릭: 0';
        clickTimerDisplay.textContent = `시간: ${gameDuration.toFixed(2)}초`;
        clickResultDisplay.textContent = '';
        
        gamePhase = 'playing';
        gameDurationInput.disabled = true;
        clickArea.classList.add('playing');
        clickMessage.textContent = '클릭 중...';
        clickArea.style.cursor = 'crosshair'; // Change cursor during game

        let startTime = new Date().getTime();
        gameInterval = setInterval(() => {
            const elapsedTime = (new Date().getTime() - startTime) / 1000;
            timer = elapsedTime;
            clickTimerDisplay.textContent = `시간: ${(gameDuration - timer).toFixed(2)}초`;

            if (timer >= gameDuration) {
                endGame();
            }
        }, 10); // Update every 10ms for smoother timer
    }

    function endGame() {
        gamePhase = 'finished';
        clearInterval(gameInterval);
        clickArea.classList.remove('playing');
        clickArea.style.cursor = 'pointer'; // Reset cursor
        
        const cps = clickCount / gameDuration;
        const grade = getClickSpeedGrade(cps);

        clickResultDisplay.innerHTML = `
            <h2>테스트 종료!</h2>
            <p>총 클릭 수: ${clickCount}</p>
            <p>초당 클릭 수 (CPS): ${cps.toFixed(2)}</p>
            <h3>등급: ${grade}</h3>
        `;

        const newResult = {
            id: new Date().getTime(),
            date: new Date().toLocaleString(),
            type: 'click',
            grade: grade,
            clickCount: clickCount,
            cps: cps.toFixed(2),
            gameDuration: gameDuration
        };

        localStorage.setItem('currentTestResult', JSON.stringify(newResult));

        let bestClickResult = JSON.parse(localStorage.getItem('bestClickTestResult'));

        if (!bestClickResult || parseFloat(newResult.cps) > parseFloat(bestClickResult.cps)) {
            localStorage.setItem('bestClickTestResult', JSON.stringify(newResult));
        }

        clickMessage.textContent = '결과 페이지로 이동 중...';

        document.body.classList.add('fade-out');
        setTimeout(() => {
            window.location.href = 'results.html';
        }, 500);
    }

    function getClickSpeedGrade(cps) {
        if (cps >= 8) return 'S';
        if (cps >= 6) return 'A';
        if (cps >= 4) return 'B';
        if (cps >= 2) return 'C';
        return 'D';
    }

    clickArea.addEventListener('mousedown', (event) => {
        if (gamePhase === 'ready') {
            startGame();
            clickCount++; // Count the first click that starts the game
            clickCountDisplay.textContent = `클릭: ${clickCount}`;
        } else if (gamePhase === 'playing') {
            clickCount++;
            clickCountDisplay.textContent = `클릭: ${clickCount}`;
        } else if (gamePhase === 'finished') {
            // After game finishes, clicking starts a new game
            resetGame();
        }
    });

    // Initial setup
    resetGame();
});