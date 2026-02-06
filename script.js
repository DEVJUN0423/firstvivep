document.addEventListener('DOMContentLoaded', () => {
    const reactionArea = document.getElementById('reaction-area');
    const resultBox = document.getElementById('result');
    const numAttemptsInput = document.getElementById('num-attempts');
    const averageResultBox = document.getElementById('average-result');

    let currentAttempt = 0;
    let totalAttempts = 0;
    let reactionTimes = [];
    let isMultiTestActive = false; // Flag to indicate if a multi-test is in progress

    if (!reactionArea || !resultBox || !numAttemptsInput || !averageResultBox) {
        return; 
    }

    const singleTestState = {
        startTime: null,
        endTime: null,
        timeoutId: null,
        state: 'ready' 
    };

    function resetSingleTest() {
        clearTimeout(singleTestState.timeoutId);
        singleTestState.state = 'ready';
        reactionArea.classList.remove('wait', 'go');
        reactionArea.classList.add('ready');
        reactionArea.textContent = '클릭하여 시작';
        resultBox.textContent = '';
        averageResultBox.textContent = '';
        resultBox.classList.remove('error');
    }

    function handleReactionClickLogic() {
        if (singleTestState.state === 'ready') {
            singleTestState.state = 'waiting';
            reactionArea.classList.remove('ready');
            reactionArea.classList.add('wait');
            reactionArea.textContent = '초록색을 기다리세요...';
            resultBox.textContent = isMultiTestActive ? `시도 ${currentAttempt}/${totalAttempts}` : '';
            resultBox.classList.remove('error');

            const randomDelay = Math.floor(Math.random() * 3000) + 1500;
            singleTestState.timeoutId = setTimeout(() => {
                singleTestState.state = 'go';
                reactionArea.classList.remove('wait');
                reactionArea.classList.add('go');
                reactionArea.textContent = '클릭!';
                singleTestState.startTime = new Date().getTime();
            }, randomDelay);

        } else if (singleTestState.state === 'waiting') {
            clearTimeout(singleTestState.timeoutId);
            singleTestState.state = 'ready';
            reactionArea.classList.remove('wait');
            reactionArea.classList.add('ready');
            resultBox.textContent = '너무 일찍 클릭했습니다! 다시 시도하세요.';
            resultBox.classList.add('error');
            reactionArea.textContent = '클릭하여 다시 시작';
            
            if(isMultiTestActive) {
                reactionTimes.push(-1); 
                setTimeout(runNextAttempt, 1000);
            }

        } else if (singleTestState.state === 'go') {
            singleTestState.endTime = new Date().getTime();
            const reactionTime = singleTestState.endTime - singleTestState.startTime;
            singleTestState.state = 'ready';
            reactionArea.classList.remove('go');
            reactionArea.classList.add('ready');
            resultBox.textContent = `반응 속도: ${reactionTime}ms`;
            resultBox.classList.remove('error');
            reactionArea.textContent = '클릭하여 다시 시작';

            if (isMultiTestActive) {
                reactionTimes.push(reactionTime);
                setTimeout(runNextAttempt, 500);
            }
        }
    }
    
    reactionArea.addEventListener('click', () => {
        if (singleTestState.state === 'ready' && !isMultiTestActive) {
            totalAttempts = parseInt(numAttemptsInput.value, 10);

            if (isNaN(totalAttempts) || totalAttempts < 1) {
                alert('유효한 시도 횟수를 입력하세요 (1 이상의 숫자).');
                return;
            }

            if (totalAttempts > 1) {
                reactionTimes = [];
                currentAttempt = 0;
                isMultiTestActive = true;
                numAttemptsInput.disabled = true; 
                startMultiAttemptTestFlow(); 
            } else { 
                handleReactionClickLogic();
            }
        } else if (singleTestState.state === 'waiting' || singleTestState.state === 'go') {
            handleReactionClickLogic();
        } else if (singleTestState.state === 'ready' && isMultiTestActive) {
            // If multi-test is active and it's ready, means previous attempt finished or was too soon
            handleReactionClickLogic();
        }
    });

    function startMultiAttemptTestFlow() {
        currentAttempt++;
        if (currentAttempt <= totalAttempts) {
            handleReactionClickLogic();
        } else {
            endMultiAttemptTest();
        }
    }

    function runNextAttempt() {
        currentAttempt++;
        if (currentAttempt <= totalAttempts) {
            resetSingleTest();
            handleReactionClickLogic();
        } else {
            endMultiAttemptTest();
        }
    }

    function endMultiAttemptTest() {
        const validReactionTimes = reactionTimes.filter(time => time > 0);
        let average = 0;
        let grade = "N/A";

        if (validReactionTimes.length > 0) {
            const sum = validReactionTimes.reduce((a, b) => a + b, 0);
            average = sum / validReactionTimes.length;
            grade = getReactionGrade(average);
            
            // Create the new result object
            const newResult = {
                id: new Date().getTime(), // Unique ID for each test result
                date: new Date().toLocaleString(), // Timestamp for when the test was completed
                grade: grade,
                average: average,
                reactionTimes: validReactionTimes
            };
            
            // Retrieve the current best result
            let bestReactionResult = JSON.parse(localStorage.getItem('bestReactionTestResult'));

            // Compare and update if the new result is better
            if (!bestReactionResult || newResult.average < bestReactionResult.average) {
                localStorage.setItem('bestReactionTestResult', JSON.stringify(newResult));
            }
            
        } else {
            // If no valid attempts, still create a result, but don't overwrite a valid best score
            const newResult = {
                id: new Date().getTime(),
                date: new Date().toLocaleString(),
                grade: 'F', 
                average: 0, 
                reactionTimes: []
            };

            // Only store if there's no valid best result, or if this invalid result is "better" than a previously stored invalid one (e.g. initial F)
            let bestReactionResult = JSON.parse(localStorage.getItem('bestReactionTestResult'));
            if (!bestReactionResult || (bestReactionResult.grade === 'F' && newResult.average < bestReactionResult.average)) { // For 'F' scores, a lower average might still be preferable
                localStorage.setItem('bestReactionTestResult', JSON.stringify(newResult));
            }
        }

        resultBox.textContent = '연속 테스트 완료!';
        averageResultBox.innerHTML = `평균 반응 속도: ${average.toFixed(2)}ms - 등급: ${grade}`; // Display summary before redirect
        reactionArea.textContent = '결과 페이지로 이동 중...';

        isMultiTestActive = false;
        numAttemptsInput.disabled = false; // Re-enable input
        resetSingleTest(); // Clean up state

        // Fade out and redirect
        document.body.classList.add('fade-out');
        setTimeout(() => {
            window.location.href = 'results.html';
        }, 500); // Match CSS transition duration
    }

    function getReactionGrade(avgTime) {
        if (avgTime < 150) return 'S';
        if (avgTime < 200) return 'A';
        if (avgTime < 250) return 'B';
        if (avgTime < 350) return 'C';
        if (avgTime < 450) return 'D';
        return 'F';
    }

    // Ensure state is reset on page load
    resetSingleTest();
});
