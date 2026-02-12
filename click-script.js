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
    let gamePhase = 'ready';
    let gameDuration = 5;

    if (!clickArea || !clickCountDisplay || !clickTimerDisplay || !clickResultDisplay || !gameDurationInput || !clickMessage) {
        console.error('One or more required elements for Click Speed Test not found.');
        return;
    }

    const CLICK_GRADE_THRESHOLDS = [
        { threshold: 8, grade: 'S' },
        { threshold: 6, grade: 'A' },
        { threshold: 4, grade: 'B' },
        { threshold: 2, grade: 'C' }
    ];

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
        clickArea.style.cursor = 'pointer';
    }

    function startGame() {
        const duration = AppUtils.validatePositiveInt(gameDurationInput.value, '테스트 시간');
        if (duration === null) return;
        gameDuration = duration;

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
        clickArea.style.cursor = 'crosshair';

        const startTime = AppUtils.now();
        gameInterval = setInterval(() => {
            const elapsedTime = (AppUtils.now() - startTime) / 1000;
            timer = elapsedTime;
            clickTimerDisplay.textContent = `시간: ${(gameDuration - timer).toFixed(2)}초`;

            if (timer >= gameDuration) {
                endGame();
            }
        }, 10);
    }

    function endGame() {
        gamePhase = 'finished';
        clearInterval(gameInterval);
        clickArea.classList.remove('playing');
        clickArea.style.cursor = 'pointer';

        const cps = clickCount / gameDuration;
        const grade = AppUtils.getGrade(CLICK_GRADE_THRESHOLDS, cps, 'D', false);

        clickResultDisplay.innerHTML = `
            <h2>테스트 종료!</h2>
            <p>총 클릭 수: ${clickCount}</p>
            <p>초당 클릭 수 (CPS): ${cps.toFixed(2)}</p>
            <h3>등급: ${grade}</h3>
        `;

        const newResult = {
            ...AppUtils.createBaseResult('click'),
            grade: grade,
            clickCount: clickCount,
            cps: cps.toFixed(2),
            gameDuration: gameDuration
        };

        AppUtils.saveTestResult('bestClickTestResult', newResult, (newR, bestR) => {
            return parseFloat(newR.cps) > parseFloat(bestR.cps);
        });

        clickMessage.textContent = '결과 페이지로 이동 중...';
        AppUtils.navigateToResults();
    }

    clickArea.addEventListener('mousedown', () => {
        if (gamePhase === 'ready') {
            startGame();
            clickCount++;
            clickCountDisplay.textContent = `클릭: ${clickCount}`;
        } else if (gamePhase === 'playing') {
            clickCount++;
            clickCountDisplay.textContent = `클릭: ${clickCount}`;
        } else if (gamePhase === 'finished') {
            resetGame();
        }
    });

    // Initial setup
    resetGame();
});
