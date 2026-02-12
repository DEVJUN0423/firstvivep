document.addEventListener('DOMContentLoaded', () => {
    const reactionArea = document.getElementById('reaction-area');
    const resultBox = document.getElementById('result');
    const numAttemptsInput = document.getElementById('num-attempts');
    const averageResultBox = document.getElementById('average-result');

    let totalAttempts = 0;
    let validReactionTimes = [];
    let isMultiTestActive = false;
    let completedAttempts = 0;

    if (!reactionArea || !resultBox || !numAttemptsInput || !averageResultBox) {
        console.error('One or more required elements for Reaction Test not found.');
        return;
    }

    const REACTION_GRADE_THRESHOLDS = [
        { threshold: 150, grade: 'S' },
        { threshold: 200, grade: 'A' },
        { threshold: 250, grade: 'B' },
        { threshold: 350, grade: 'C' },
        { threshold: 450, grade: 'D' }
    ];

    const singleTestState = {
        startTime: null,
        endTime: null,
        timeoutId: null,
        state: 'ready'
    };

    function getStartText() {
        return parseInt(numAttemptsInput.value, 10) > 1 ? '클릭하여 테스트 시작' : '클릭하여 시작';
    }

    function resetSingleTest() {
        clearTimeout(singleTestState.timeoutId);
        singleTestState.state = 'ready';
        reactionArea.classList.remove('wait', 'go');
        reactionArea.classList.add('ready');
        resultBox.classList.remove('error');
    }

    function startWaitingPhase() {
        singleTestState.state = 'waiting';
        reactionArea.classList.remove('ready');
        reactionArea.classList.add('wait');
        reactionArea.textContent = '초록색을 기다리세요...';
        resultBox.textContent = totalAttempts > 1 ? `시도 ${completedAttempts + 1}/${totalAttempts}` : '';
        resultBox.classList.remove('error');

        const randomDelay = Math.floor(Math.random() * 3000) + 1500;
        singleTestState.timeoutId = setTimeout(() => {
            singleTestState.state = 'go';
            reactionArea.classList.remove('wait');
            reactionArea.classList.add('go');
            reactionArea.textContent = '클릭!';
            singleTestState.startTime = AppUtils.now();
        }, randomDelay);
    }

    function handleReactionClickLogic() {
        if (singleTestState.state === 'waiting') {
            clearTimeout(singleTestState.timeoutId);

            isMultiTestActive = false;
            numAttemptsInput.disabled = false;
            validReactionTimes = [];
            completedAttempts = 0;

            resetSingleTest();
            resultBox.textContent = '너무 일찍 클릭했습니다! 시도 횟수를 변경하거나 다시 시작하세요.';
            resultBox.classList.add('error');
            reactionArea.textContent = getStartText();

        } else if (singleTestState.state === 'go') {
            singleTestState.endTime = AppUtils.now();
            const reactionTime = Math.round(singleTestState.endTime - singleTestState.startTime);
            resetSingleTest();
            resultBox.textContent = `반응 속도: ${reactionTime}ms`;
            resultBox.classList.remove('error');

            validReactionTimes.push(reactionTime);
            completedAttempts++;

            if (totalAttempts > 1) {
                if (completedAttempts < totalAttempts) {
                    setTimeout(startMultiAttemptTestFlow, 500);
                } else {
                    setTimeout(endMultiAttemptTest, 500);
                }
            } else {
                reactionArea.textContent = '클릭하여 다시 시작';
            }
        }
    }

    reactionArea.addEventListener('click', () => {
        if (singleTestState.state === 'ready') {
            if (initMultiAttemptTest()) {
                startWaitingPhase();
            }
        } else if (singleTestState.state === 'waiting' || singleTestState.state === 'go') {
            handleReactionClickLogic();
        } else if (singleTestState.state === 'finished') {
            isMultiTestActive = false;
            numAttemptsInput.disabled = false;
            resetSingleTest();
            reactionArea.textContent = getStartText();
            resultBox.textContent = '';
        }
    });

    function startMultiAttemptTestFlow() {
        if (completedAttempts < totalAttempts) {
            resetSingleTest();
            startWaitingPhase();
        } else {
            endMultiAttemptTest();
        }
    }

    function initMultiAttemptTest() {
        const attemptsValue = AppUtils.validatePositiveInt(numAttemptsInput.value, '시도 횟수');
        if (attemptsValue === null) return false;

        totalAttempts = attemptsValue;
        validReactionTimes = [];
        completedAttempts = 0;
        isMultiTestActive = (totalAttempts > 1);
        numAttemptsInput.disabled = true;
        return true;
    }

    function endMultiAttemptTest() {
        let average = 0;
        let grade = 'F';

        if (validReactionTimes.length > 0) {
            const sum = validReactionTimes.reduce((a, b) => a + b, 0);
            average = sum / validReactionTimes.length;
            grade = AppUtils.getGrade(REACTION_GRADE_THRESHOLDS, average, 'F', true);
        }

        const newResult = {
            ...AppUtils.createBaseResult('reaction'),
            grade: grade,
            average: average,
            reactionTimes: validReactionTimes,
            totalAttempts: totalAttempts
        };

        AppUtils.saveTestResult('bestReactionTestResult', newResult, (newR, bestR) => {
            return (newR.grade !== 'F' && newR.average < bestR.average) ||
                   (bestR.grade === 'F' && newR.grade !== 'F');
        });

        resultBox.textContent = '연속 테스트 완료!';
        reactionArea.textContent = '결과 페이지로 이동 중...';

        singleTestState.state = 'finished';
        isMultiTestActive = false;
        numAttemptsInput.disabled = false;

        AppUtils.navigateToResults();
    }

    // Initial setup
    resetSingleTest();
    reactionArea.textContent = getStartText();

    numAttemptsInput.addEventListener('change', () => {
        if (singleTestState.state === 'ready' && !isMultiTestActive) {
            reactionArea.textContent = getStartText();
        }
    });
});
