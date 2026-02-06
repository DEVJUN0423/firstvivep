document.addEventListener('DOMContentLoaded', () => {
    const reactionArea = document.getElementById('reaction-area');
    const resultBox = document.getElementById('result');
    const numAttemptsInput = document.getElementById('num-attempts');
    const averageResultBox = document.getElementById('average-result'); // Still reference, but innerHTML is removed

    let totalAttempts = 0; // This will now be set by initMultiAttemptTest
    let validReactionTimes = [];
    let isMultiTestActive = false;
    let completedAttempts = 0;

    if (!reactionArea || !resultBox || !numAttemptsInput || !averageResultBox) {
        console.error('One or more required elements for Reaction Test not found. Script may not function correctly.');
        return;
    }

    const singleTestState = {
        startTime: null,
        endTime: null,
        timeoutId: null,
        state: 'ready' // 'ready', 'waiting', 'go'
    };

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
        if (totalAttempts > 1) { // Only show attempt count if it's a multi-attempt test
            resultBox.textContent = `시도 ${completedAttempts + 1}/${totalAttempts}`;
        } else {
            resultBox.textContent = ''; // Clear for single test
        }
        resultBox.classList.remove('error');

        const randomDelay = Math.floor(Math.random() * 3000) + 1500;
        singleTestState.timeoutId = setTimeout(() => {
            singleTestState.state = 'go';
            reactionArea.classList.remove('wait');
            reactionArea.classList.add('go');
            reactionArea.textContent = '클릭!';
            singleTestState.startTime = new Date().getTime();
        }, randomDelay);
    }

    function handleReactionClickLogic() {
        if (singleTestState.state === 'waiting') {
            // Early click: Abort current multi-attempt series
            clearTimeout(singleTestState.timeoutId);
            
            isMultiTestActive = false; // Reset multi-test flag
            numAttemptsInput.disabled = false; // Re-enable input
            validReactionTimes = []; // Clear recorded times
            completedAttempts = 0; // Reset completed attempts count

            resetSingleTest(); // Reset visual state and singleTestState.state to 'ready'
            resultBox.textContent = `너무 일찍 클릭했습니다! 시도 횟수를 변경하거나 다시 시작하세요.`;
            resultBox.classList.add('error');
            
            // Set initial message based on current numAttemptsInput value
            if (parseInt(numAttemptsInput.value, 10) > 1) {
                reactionArea.textContent = '클릭하여 테스트 시작';
            } else {
                reactionArea.textContent = '클릭하여 시작';
            }

        } else if (singleTestState.state === 'go') {
            singleTestState.endTime = new Date().getTime();
            const reactionTime = singleTestState.endTime - singleTestState.startTime;
            resetSingleTest();
            resultBox.textContent = `반응 속도: ${reactionTime}ms`;
            resultBox.classList.remove('error');

            validReactionTimes.push(reactionTime);
            completedAttempts++;

            if (totalAttempts > 1) { // Check if it's a multi-attempt test
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
            // This click will always initiate a new test flow (single or multi)
            if (initMultiAttemptTest()) { // This now correctly reads numAttemptsInput.value
                startWaitingPhase();
            }
        } else if (singleTestState.state === 'waiting' || singleTestState.state === 'go') {
            handleReactionClickLogic();
        } else if (singleTestState.state === 'finished') {
            // After game finishes, clicking restarts the whole test setup
            isMultiTestActive = false;
            numAttemptsInput.disabled = false;
            resetSingleTest();
            reactionArea.textContent = '클릭하여 시작';
            resultBox.textContent = '';
            // And then, if numAttempts > 1, update text
            if (parseInt(numAttemptsInput.value, 10) > 1) {
                reactionArea.textContent = '클릭하여 테스트 시작';
            }
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
        const attemptsValue = parseInt(numAttemptsInput.value, 10);
        if (isNaN(attemptsValue) || attemptsValue < 1) {
            alert('유효한 시도 횟수를 입력하세요 (1 이상의 숫자).');
            return false;
        }
        totalAttempts = attemptsValue; // Set totalAttempts from input
        validReactionTimes = [];
        completedAttempts = 0;
        isMultiTestActive = (totalAttempts > 1); // Set flag based on totalAttempts
        numAttemptsInput.disabled = true;
        return true;
    }

    function endMultiAttemptTest() {
        let average = 0;
        let grade = "F";

        if (validReactionTimes.length > 0) {
            const sum = validReactionTimes.reduce((a, b) => a + b, 0);
            average = sum / validReactionTimes.length;
            grade = getReactionGrade(average);
        }

        const newResult = {
            id: new Date().getTime(),
            date: new Date().toLocaleString(),
            type: 'reaction',
            grade: grade,
            average: average,
            reactionTimes: validReactionTimes,
            totalAttempts: totalAttempts
        };

        localStorage.setItem('currentTestResult', JSON.stringify(newResult));
        let bestReactionResult = JSON.parse(localStorage.getItem('bestReactionTestResult'));

        if (!bestReactionResult || (newResult.grade !== 'F' && newResult.average < bestReactionResult.average) || (bestReactionResult.grade === 'F' && newResult.grade !== 'F')) {
            localStorage.setItem('bestReactionTestResult', JSON.stringify(newResult));
        }

        resultBox.textContent = '연속 테스트 완료!';
        reactionArea.textContent = '결과 페이지로 이동 중...';

        singleTestState.state = 'finished';
        isMultiTestActive = false;
        numAttemptsInput.disabled = false;

        document.body.classList.add('fade-out');
        setTimeout(() => {
            window.location.href = 'results.html';
        }, 500);
    }

    function getReactionGrade(avgTime) {
        if (avgTime < 150) return 'S';
        if (avgTime < 200) return 'A';
        if (avgTime < 250) return 'B';
        if (avgTime < 350) return 'C';
        if (avgTime < 450) return 'D';
        return 'F';
    }

    // Initial setup on page load
    resetSingleTest();
    if (parseInt(numAttemptsInput.value, 10) > 1) {
        reactionArea.textContent = '클릭하여 테스트 시작';
    } else {
        reactionArea.textContent = '클릭하여 시작';
    }

    numAttemptsInput.addEventListener('change', () => {
        if (singleTestState.state === 'ready' && !isMultiTestActive) {
            if (parseInt(numAttemptsInput.value, 10) > 1) {
                reactionArea.textContent = '클릭하여 테스트 시작';
            } else {
                reactionArea.textContent = '클릭하여 시작';
            }
        }
    });
});