document.addEventListener('DOMContentLoaded', () => {
    const clickArea = document.getElementById('click-area');
    const clickCountDisplay = document.getElementById('click-count');
    const clickTimerDisplay = document.getElementById('click-timer');
    const clickResultDisplay = document.getElementById('click-result');
    const gameDurationInput = document.getElementById('game-duration-input');

    let clickCount = 0;
    let timer = 0;
    let gameInterval;
    let gameRunning = false;
    let gameDuration = 5; // Default to 5 seconds

    if (!clickArea || !clickCountDisplay || !clickTimerDisplay || !clickResultDisplay || !gameDurationInput) {
        console.error('One or more required elements for Click Speed Test not found. Script may not function correctly.');
        return;
    }

    function resetGame() {
        clickCount = 0;
        timer = 0;
        gameRunning = false;
        clearInterval(gameInterval);
        clickCountDisplay.textContent = '클릭: 0';
        clickTimerDisplay.textContent = '시간: 0.00초';
        clickResultDisplay.textContent = '';
        clickArea.textContent = '클릭하여 시작';
        clickArea.classList.remove('playing');
        gameDurationInput.disabled = false;
    }

    function startGame() {
        gameDuration = parseInt(gameDurationInput.value, 10);
        if (isNaN(gameDuration) || gameDuration <= 0) {
            alert('유효한 테스트 시간을 입력하세요 (양의 정수).');
            return;
        }

        resetGame();
        gameRunning = true;
        gameDurationInput.disabled = true;
        clickArea.textContent = '클릭!';
        clickArea.classList.add('playing');
        
        clickCountDisplay.textContent = '클릭: 0';
        clickTimerDisplay.textContent = `시간: ${gameDuration.toFixed(2)}초`;

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
        gameRunning = false;
        clearInterval(gameInterval);
        clickArea.classList.remove('playing');
        
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
            grade: grade,
            clickCount: clickCount,
            cps: cps.toFixed(2),
            gameDuration: gameDuration
        };

        let bestClickResult = JSON.parse(localStorage.getItem('bestClickTestResult'));

        // Higher CPS is better
        if (!bestClickResult || parseFloat(newResult.cps) > parseFloat(bestClickResult.cps)) {
            localStorage.setItem('bestClickTestResult', JSON.stringify(newResult));
        }

        clickArea.textContent = '결과 페이지로 이동 중...';

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

    clickArea.addEventListener('mousedown', () => {
        if (gameRunning) {
            clickCount++;
            clickCountDisplay.textContent = `클릭: ${clickCount}`;
        } else if (clickArea.classList.contains('ready')) {
            startGame();
            clickCount++; // Count the first click that starts the game
            clickCountDisplay.textContent = `클릭: ${clickCount}`;
        }
    });

    // Initial setup
    resetGame();
});