document.addEventListener('DOMContentLoaded', () => {
    const prevButton = document.getElementById('prev-result');
    const nextButton = document.getElementById('next-result');
    const resultCounter = document.getElementById('result-counter');
    const shareButton = document.getElementById('share-result'); // New
    const shareModal = document.getElementById('share-modal'); // New
    const closeButton = shareModal.querySelector('.close-button'); // New
    const shareTextDisplay = document.getElementById('share-text-display'); // New
    const copyShareLinkButton = document.getElementById('copy-share-link'); // New
    const shareTwitterButton = document.getElementById('share-twitter'); // New
    const shareFacebookButton = document.getElementById('share-facebook'); // New


    // Configuration for each test type, crucial for extensibility
    const testTypesConfig = [
        {
            id: 'reaction',
            name: '반응 속도 테스트',
            localStorageKey: 'bestReactionTestResult',
            cardId: 'reaction-result-card',
            gradeElId: 'reaction-grade',
            statsElId: 'reaction-stats',
            chartCanvasId: 'reaction-chart-results',
            chartInstance: null,
            comparisonMetric: 'average', // Lower is better
            metricUnit: 'ms'
        },
        {
            id: 'accuracy',
            name: '마우스 정확도 테스트',
            localStorageKey: 'bestAccuracyTestResult',
            cardId: 'accuracy-result-card',
            gradeElId: 'accuracy-grade',
            statsElId: 'accuracy-stats',
            chartCanvasId: 'accuracy-chart-results',
            chartInstance: null,
            comparisonMetric: 'score', // Higher is better
            metricUnit: '점'
        },
        {
            id: 'click',
            name: '클릭 속도 테스트',
            localStorageKey: 'bestClickTestResult',
            cardId: 'click-speed-result-card',
            gradeElId: 'click-speed-grade',
            statsElId: 'click-speed-stats',
            chartCanvasId: 'click-speed-chart-results',
            chartInstance: null,
            comparisonMetric: 'cps', // Higher is better
            metricUnit: 'CPS'
        },
        {
            id: 'memory',
            name: '시각적 기억력 테스트',
            localStorageKey: 'bestMemoryTestResult',
            cardId: 'memory-result-card',
            gradeElId: 'memory-grade',
            statsElId: 'memory-stats',
            chartCanvasId: 'memory-chart-results',
            chartInstance: null,
            comparisonMetric: 'finalScore', // Higher is better
            metricUnit: '점'
        }
        // Add more test types here as they are developed
    ];

    let currentTestTypeIndex = 0; // Index for navigating through testTypesConfig
    let currentDisplayedResultData = null; // Store data of the currently displayed best result for sharing

    function renderComparisonMessage(currentResult, bestResult, config) {
        const resultCardEl = document.getElementById(config.cardId);
        if (!resultCardEl) return;

        // Remove any existing comparison message
        const existingMsg = resultCardEl.querySelector('.comparison-message');
        if (existingMsg) existingMsg.remove();

        const gradeEl = document.getElementById(config.gradeElId);
        if (!gradeEl) return;

        let message = '';
        const currentMetric = currentResult[config.comparisonMetric];
        const bestMetric = bestResult[config.comparisonMetric];

        const isNewBest = (config.comparisonMetric === 'average' && currentMetric < bestMetric) || 
                          (config.comparisonMetric !== 'average' && currentMetric > bestMetric);

        if (isNewBest) {
            message = `<div class="comparison-message new-best">🎉 새로운 최고 기록입니다!</div>`;
        } else {
            const diff = Math.abs(currentMetric - bestMetric).toFixed(2);
            const comparisonText = config.comparisonMetric === 'average' ? '느립니다' : '낮습니다';
            message = `<div class="comparison-message missed-best">아쉽네요! 최고 기록보다 ${diff}${config.metricUnit} ${comparisonText}.</div>`;
        }

        gradeEl.insertAdjacentHTML('afterend', message);
    }

    function generateShareMessage(config, resultData) {
        let message = `${config.name} - 등급: ${resultData.grade}! `;
        switch (config.id) {
            case 'reaction':
                message += `평균 반응 속도: ${resultData.average.toFixed(2)}ms.`;
                break;
            case 'accuracy':
                message += `최종 점수: ${resultData.score}점, 명중률: ${resultData.accuracy}%.`;
                break;
            case 'click':
                message += `초당 클릭 수 (CPS): ${resultData.cps}.`;
                break;
            case 'memory':
                message += `최종 점수: ${resultData.finalScore}점, 정답 ${resultData.totalCorrectClicks}개.`;
                break;
            default:
                message += `내 점수를 확인해보세요!`;
        }
        message += ` #반응속도테스트 #집중력테스트`; // Hashtags for virality
        return message;
    }

    function openShareModal(message, shareUrl) {
        shareModal.style.display = 'flex'; // Use flex to center content
        shareTextDisplay.textContent = message;

        // Set Twitter/Facebook share links
        const twitterText = encodeURIComponent(message + ' ' + shareUrl);
        shareTwitterButton.href = `https://twitter.com/intent/tweet?text=${twitterText}`;

        const facebookShareUrl = encodeURIComponent(shareUrl);
        shareFacebookButton.href = `https://www.facebook.com/sharer/sharer.php?u=${facebookShareUrl}&quote=${encodeURIComponent(message)}`;
    }

    function closeShareModal() {
        shareModal.style.display = 'none';
    }

    async function copyLinkToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            alert('링크가 클립보드에 복사되었습니다!');
        } catch (err) {
            console.error('클립보드 복사 실패:', err);
            alert('링크 복사에 실패했습니다. 수동으로 복사해주세요: ' + text);
        }
    }

    // Main sharing function
    async function shareCurrentResult() {
        const config = testTypesConfig[currentTestTypeIndex];
        const resultData = JSON.parse(localStorage.getItem(config.localStorageKey)); // Always share the best result

        if (!resultData) {
            alert('공유할 기록이 없습니다. 먼저 테스트를 완료해주세요!');
            return;
        }

        const shareMessage = generateShareMessage(config, resultData);
        const appUrl = window.location.origin + '/index.html'; // Base URL for the app

        if (navigator.share) {
            try {
                await navigator.share({
                    title: '반응 속도 테스트 결과',
                    text: shareMessage,
                    url: appUrl,
                });
                console.log('결과가 성공적으로 공유되었습니다!');
            } catch (error) {
                console.error('공유 실패:', error);
                // Fallback to modal if native share fails or is dismissed
                openShareModal(shareMessage, appUrl);
            }
        } else {
            // Fallback for browsers that do not support navigator.share
            openShareModal(shareMessage, appUrl);
        }
    }


    function loadAndRenderAllResults() {
        const currentTestResult = JSON.parse(localStorage.getItem('currentTestResult'));
        let testJustCompleted = false;

        if (currentTestResult && currentTestResult.type) {
            const configIndex = testTypesConfig.findIndex(t => t.id === currentTestResult.type);
            if (configIndex !== -1) {
                currentTestTypeIndex = configIndex; // Navigate to the result of the test just played
                testJustCompleted = true;
            }
        }
        
        // Render all cards initially to have them ready
        testTypesConfig.forEach(config => {
            renderCard(config, currentTestResult && currentTestResult.type === config.id ? currentTestResult : null);
        });

        // After rendering, handle navigation and display
        updateNavigationState();
        showCurrentCard();

        if (testJustCompleted) {
            localStorage.removeItem('currentTestResult'); // Clean up after use
        }
    }

    function renderCard(config, currentResult) {
        const resultCardEl = document.getElementById(config.cardId);
        if (!resultCardEl) return;

        const gradeEl = document.getElementById(config.gradeElId);
        const statsEl = document.getElementById(config.statsElId);
        
        const bestResult = JSON.parse(localStorage.getItem(config.localStorageKey));
        currentDisplayedResultData = bestResult; // Update global variable for sharing

        if (bestResult) {
            gradeEl.textContent = `등급: ${bestResult.grade}`;

            // If a recent test was just completed, show comparison message
            if (currentResult) {
                renderComparisonMessage(currentResult, bestResult, config);
            }
            
            // Render stats and chart based on BEST result
            renderStatsAndChart(config, bestResult, statsEl);

        } else if (currentResult) {
            // This case handles the very first run of a test
            gradeEl.textContent = `등급: ${currentResult.grade}`;
            const newBestMsg = `<div class="comparison-message new-best">🎉 첫 기록! 새로운 최고 기록입니다!</div>`;
            gradeEl.insertAdjacentHTML('afterend', newBestMsg);
            renderStatsAndChart(config, currentResult, statsEl);
            currentDisplayedResultData = currentResult; // First result is also the best
        } else {
            gradeEl.textContent = '기록 없음';
            statsEl.innerHTML = `<p>${config.name} 최고 기록을 달성해보세요!</p>`;
            clearChart(config);
            currentDisplayedResultData = null; // No data to share
        }
    }

    function renderStatsAndChart(config, resultData, statsEl) {
        if (config.id === 'reaction') {
            statsEl.innerHTML = `
                <p>기록 날짜: ${resultData.date}</p>
                <p>평균 반응 속도: ${resultData.average.toFixed(2)}ms</p>
            `;
            updateChart(config, {
                labels: resultData.reactionTimes.map((_, i) => `시도 ${i + 1}`),
                datasets: [{ label: '반응 시간 (ms)', data: resultData.reactionTimes }]
            }, 'line');
        } else if (config.id === 'accuracy') {
            statsEl.innerHTML = `
                <p>기록 날짜: ${resultData.date}</p>
                <p>난이도: ${resultData.difficulty}</p>
                <p>최종 점수: ${resultData.score}</p>
                <p>명중률: ${resultData.accuracy}%</p>
                <p>평균 반응 시간: ${resultData.avgReactionTime}ms</p>
            `;
            updateChart(config, {
                labels: resultData.reactionTimes.map((_, i) => `명중 ${i + 1}`),
                datasets: [{ label: '반응 시간 (ms)', data: resultData.reactionTimes }]
            }, 'line');
        } else if (config.id === 'click') {
            statsEl.innerHTML = `
                <p>기록 날짜: ${resultData.date}</p>
                <p>총 클릭 수: ${resultData.clickCount}</p>
                <p>테스트 시간: ${resultData.gameDuration}초</p>
                <p>초당 클릭 수 (CPS): ${resultData.cps}</p>
            `;
            updateChart(config, {
                labels: ['CPS'],
                datasets: [{ label: '초당 클릭 수', data: [parseFloat(resultData.cps)] }]
            }, 'bar');
        } else if (config.id === 'memory') {
            statsEl.innerHTML = `
                <p>기록 날짜: ${resultData.date}</p>
                <p>최종 점수: ${resultData.finalScore}</p>
                <p>총 정답: ${resultData.totalCorrectClicks}개</p>
                <p>총 오답: ${resultData.totalIncorrectClicks}개</p>
                <p>난이도: ${resultData.gridSize}x${resultData.gridSize}</p>
            `;
            const chartData = {
                labels: ['정답', '오답'],
                datasets: [{
                    label: '클릭 수',
                    data: [resultData.totalCorrectClicks, resultData.totalIncorrectClicks],
                    backgroundColor: ['rgb(75, 192, 192)', 'rgb(255, 99, 132)']
                }]
            };
            updateChart(config, chartData, 'bar');
        }
    }


    function updateChart(config, chartData, chartType) {
        const chartCanvas = document.getElementById(config.chartCanvasId);
        if (!chartCanvas) return;

        if (config.chartInstance) {
            config.chartInstance.destroy();
        }

        const ctx = chartCanvas.getContext('2d');
        config.chartInstance = new Chart(ctx, {
            type: chartType,
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: chartData.datasets.length === 1, text: chartData.datasets[0].label }
                    },
                    x: {
                        title: { display: false }
                    }
                },
                plugins: {
                    legend: {
                        display: chartData.datasets.length > 1 || chartType === 'bar', // Better legend handling
                        position: 'top'
                    }
                }
            }
        });
    }

    function clearChart(config) {
        if (config.chartInstance) {
            config.chartInstance.destroy();
            config.chartInstance = null;
        }
    }

    function showCurrentCard() {
        // Hide all cards
        document.querySelectorAll('.test-result-item').forEach(card => {
            card.style.display = 'none';
        });
        // Show the current one
        const currentCardId = testTypesConfig[currentTestTypeIndex].cardId;
        const currentCard = document.getElementById(currentCardId);
        if (currentCard) {
            currentCard.style.display = 'block';
        }
        // Update share button's status based on whether there's data to share
        const config = testTypesConfig[currentTestTypeIndex];
        const resultData = JSON.parse(localStorage.getItem(config.localStorageKey));
        if (resultData) {
            shareButton.disabled = false;
        } else {
            shareButton.disabled = true;
        }
    }
    
    function updateNavigationState() {
        resultCounter.textContent = `${testTypesConfig[currentTestTypeIndex].name}`;
        prevButton.disabled = currentTestTypeIndex === 0;
        nextButton.disabled = currentTestTypeIndex === testTypesConfig.length - 1;
    }

    // Event Listeners for navigation
    prevButton.addEventListener('click', () => {
        if (currentTestTypeIndex > 0) {
            currentTestTypeIndex--;
            showCurrentCard();
            updateNavigationState();
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentTestTypeIndex < testTypesConfig.length - 1) {
            currentTestTypeIndex++;
            showCurrentCard();
            updateNavigationState();
        }
    });

    // Event Listeners for sharing
    shareButton.addEventListener('click', shareCurrentResult);

    closeButton.addEventListener('click', closeShareModal);
    shareModal.addEventListener('click', (event) => {
        if (event.target === shareModal) {
            closeShareModal();
        }
    });
    copyShareLinkButton.addEventListener('click', () => {
        const config = testTypesConfig[currentTestTypeIndex];
        const appUrl = window.location.origin + '/index.html';
        copyLinkToClipboard(appUrl);
    });


    // Initial load
    loadAndRenderAllResults();
});