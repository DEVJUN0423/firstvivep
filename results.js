document.addEventListener('DOMContentLoaded', () => {
    const prevButton = document.getElementById('prev-result');
    const nextButton = document.getElementById('next-result');
    const resultCounter = document.getElementById('result-counter');
    const shareButton = document.getElementById('share-result');
    const shareModal = document.getElementById('share-modal');
    const closeButton = shareModal.querySelector('.close-button');
    const shareTextDisplay = document.getElementById('share-text-display');
    const copyShareLinkButton = document.getElementById('copy-share-link');
    const shareTwitterButton = document.getElementById('share-twitter');
    const shareFacebookButton = document.getElementById('share-facebook');
    const testResultsDisplay = document.getElementById('test-results-display');

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
            comparisonMetric: 'average',
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
            comparisonMetric: 'score',
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
            comparisonMetric: 'cps',
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
            comparisonMetric: 'finalScore',
            metricUnit: '점'
        }
    ];

    let currentTestTypeIndex = 0;
    let challengeUrlToCopy = '';
    let isTransitioning = false; // New flag to prevent rapid clicks

    function renderComparisonMessage(currentResult, bestResult, config) {
        const resultCardEl = document.getElementById(config.cardId);
        if (!resultCardEl) return;
        const existingMsg = resultCardEl.querySelector('.comparison-message');
        if (existingMsg) existingMsg.remove();
        const gradeEl = document.getElementById(config.gradeElId);
        if (!gradeEl) return;

        let message = '';
        const currentMetric = currentResult[config.comparisonMetric];
        const bestMetric = bestResult[config.comparisonMetric];
        const isNewBest = (config.comparisonMetric === 'average' && currentMetric < bestMetric) || (config.comparisonMetric !== 'average' && currentMetric > bestMetric);

        if (isNewBest) {
            message = `<div class="comparison-message new-best">🎉 새로운 최고 기록입니다!</div>`;
        } else {
            const diff = Math.abs(currentMetric - bestMetric).toFixed(2);
            const comparisonText = config.comparisonMetric === 'average' ? '느립니다' : '낮습니다';
            message = `<div class="comparison-message missed-best">아쉽네요! 최고 기록보다 ${diff}${config.metricUnit} ${comparisonText}.</div>`;
        }
        gradeEl.insertAdjacentHTML('afterend', message);
    }

    function generateChallengeMessage(config, resultData) {
        return `제가 ${config.name}에서 ${resultData[config.comparisonMetric]}${config.metricUnit} (등급: ${resultData.grade})를 기록했습니다! 저를 이겨보세요! #반응속도테스트 #도전`;
    }

    function openShareModal(message, url) {
        challengeUrlToCopy = url;
        shareModal.style.display = 'flex';
        shareTextDisplay.textContent = message;

        const encodedUrl = encodeURIComponent(url);
        const encodedMessage = encodeURIComponent(message);
        
        shareTwitterButton.href = `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`;
        shareFacebookButton.href = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedMessage}`;
    }

    function closeShareModal() {
        shareModal.style.display = 'none';
    }

    async function copyLinkToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            alert('도전 링크가 클립보드에 복사되었습니다!');
        } catch (err) {
            console.error('클립보드 복사 실패:', err);
            alert('링크 복사에 실패했습니다.');
        }
    }

    async function shareCurrentResult() {
        const config = testTypesConfig[currentTestTypeIndex];
        const resultData = JSON.parse(localStorage.getItem(config.localStorageKey));

        if (!resultData) {
            alert('공유할 기록이 없습니다. 먼저 테스트를 완료해주세요!');
            return;
        }

        const challengeData = {
            type: config.id,
            grade: resultData.grade,
            metric: resultData[config.comparisonMetric],
            unit: config.metricUnit
        };

        const encodedChallenge = btoa(encodeURIComponent(JSON.stringify(challengeData)));
        const challengeUrl = `${window.location.origin}/index.html?challenge=${encodedChallenge}`;
        const shareMessage = generateChallengeMessage(config, resultData);

        if (navigator.share) {
            try {
                await navigator.share({
                    title: '기록 도전!',
                    text: shareMessage,
                    url: challengeUrl,
                });
            } catch (error) {
                console.error('공유 실패:', error);
                openShareModal(shareMessage, challengeUrl);
            }
        } else {
            openShareModal(shareMessage, challengeUrl);
        }
    }

    function loadAndRenderAllResults() {
        const currentTestResult = JSON.parse(localStorage.getItem('currentTestResult'));
        let testJustCompleted = false;

        if (currentTestResult && currentTestResult.type) {
            const configIndex = testTypesConfig.findIndex(t => t.id === currentTestResult.type);
            if (configIndex !== -1) {
                currentTestTypeIndex = configIndex;
                testJustCompleted = true;
            }
        }
        
        testTypesConfig.forEach(config => {
            renderCard(config, currentTestResult && currentTestResult.type === config.id ? currentTestResult : null);
        });

        updateNavigationState();
        showCurrentCard(false); // Initial load, no animation
        
        if (testJustCompleted) {
            localStorage.removeItem('currentTestResult');
        }
    }

    function renderCard(config, currentResult) {
        const resultCardEl = document.getElementById(config.cardId);
        if (!resultCardEl) return;

        const gradeEl = document.getElementById(config.gradeElId);
        const statsEl = document.getElementById(config.statsElId);
        const bestResult = JSON.parse(localStorage.getItem(config.localStorageKey));

        if (bestResult) {
            gradeEl.textContent = `등급: ${bestResult.grade}`;
            if (currentResult) {
                renderComparisonMessage(currentResult, bestResult, config);
            }
            renderStatsAndChart(config, bestResult, statsEl);
        } else if (currentResult) {
            gradeEl.textContent = `등급: ${currentResult.grade}`;
            const newBestMsg = `<div class="comparison-message new-best">🎉 첫 기록! 새로운 최고 기록입니다!</div>`;
            gradeEl.insertAdjacentHTML('afterend', newBestMsg);
            renderStatsAndChart(config, currentResult, statsEl);
        } else {
            gradeEl.textContent = '기록 없음';
            statsEl.innerHTML = `<p>${config.name} 최고 기록을 달성해보세요!</p>`;
            clearChart(config);
        }
    }

    function renderStatsAndChart(config, resultData, statsEl) {
        if (config.id === 'reaction') {
            statsEl.innerHTML = `<p>기록 날짜: ${resultData.date}</p><p>평균 반응 속도: ${resultData.average.toFixed(2)}ms</p>`;
            updateChart(config, { labels: resultData.reactionTimes.map((_, i) => `시도 ${i + 1}`), datasets: [{ label: '반응 시간 (ms)', data: resultData.reactionTimes }] }, 'line');
        } else if (config.id === 'accuracy') {
            statsEl.innerHTML = `<p>기록 날짜: ${resultData.date}</p><p>난이도: ${resultData.difficulty}</p><p>최종 점수: ${resultData.score}</p><p>명중률: ${resultData.accuracy}%</p><p>평균 반응 시간: ${resultData.avgReactionTime}ms</p>`;
            updateChart(config, { labels: resultData.reactionTimes.map((_, i) => `명중 ${i + 1}`), datasets: [{ label: '반응 시간 (ms)', data: resultData.reactionTimes }] }, 'line');
        } else if (config.id === 'click') {
            statsEl.innerHTML = `<p>기록 날짜: ${resultData.date}</p><p>총 클릭 수: ${resultData.clickCount}</p><p>테스트 시간: ${resultData.gameDuration}초</p><p>초당 클릭 수 (CPS): ${resultData.cps}</p>`;
            updateChart(config, { labels: ['CPS'], datasets: [{ label: '초당 클릭 수', data: [parseFloat(resultData.cps)] }] }, 'bar');
        } else if (config.id === 'memory') {
            statsEl.innerHTML = `<p>기록 날짜: ${resultData.date}</p><p>최종 점수: ${resultData.finalScore}</p><p>총 정답: ${resultData.totalCorrectClicks}개</p><p>총 오답: ${resultData.totalIncorrectClicks}개</p><p>난이도: ${resultData.gridSize}x${resultData.gridSize}</p><p>기억 시간: ${resultData.recallDuration}초</p>`;
            const chartData = { labels: ['정답', '오답'], datasets: [{ label: '클릭 수', data: [resultData.totalCorrectClicks, resultData.totalIncorrectClicks], backgroundColor: ['rgb(75, 192, 192)', 'rgb(255, 99, 132)'] }] };
            updateChart(config, chartData, 'bar');
        }
    }

    function updateChart(config, chartData, chartType) {
        const chartCanvas = document.getElementById(config.chartCanvasId);
        if (!chartCanvas) return;
        if (config.chartInstance) config.chartInstance.destroy();
        const ctx = chartCanvas.getContext('2d');
        config.chartInstance = new Chart(ctx, {
            type: chartType,
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 500, // 0.5 second for chart animation
                    easing: 'easeOutQuart', // A smooth easing function
                    // For bar charts, animate 'y' to grow from bottom
                    // For line charts, animate 'x' and 'y' for drawing effect
                    x: {
                        from: chartType === 'line' ? 0 : undefined // Animate x-axis for lines
                    },
                    y: {
                        from: chartType === 'bar' ? 0 : undefined // Animate y-axis for bars
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: chartData.datasets.length === 1, text: chartData.datasets[0].label }
                    },
                    x: {
                        title: { display: false }
                    }
                },
                plugins: { legend: { display: chartData.datasets.length > 1 || chartType === 'bar', position: 'top' } }
            }
        });
    }

    function clearChart(config) {
        if (config.chartInstance) {
            config.chartInstance.destroy();
            config.chartInstance = null;
        }
    }

    function showCurrentCard(animate = true) {
        if (isTransitioning && animate) return; // Prevent new transitions if one is active

        const allCards = document.querySelectorAll('.test-result-item');
        const currentCard = document.getElementById(testTypesConfig[currentTestTypeIndex].cardId);

        if (!animate) {
            allCards.forEach(card => card.style.display = 'none');
            if (currentCard) currentCard.style.display = 'block';
            
            const config = testTypesConfig[currentTestTypeIndex];
            const resultData = JSON.parse(localStorage.getItem(config.localStorageKey));
            if (resultData) {
                renderStatsAndChart(config, resultData, document.getElementById(config.statsElId));
            } else {
                clearChart(config);
            }
            shareButton.disabled = !resultData;
            return;
        }

        isTransitioning = true; // Set flag at the start of an animated transition

        const visibleCard = Array.from(allCards).find(card => card.style.display === 'block');
        if (visibleCard) {
            visibleCard.classList.add('card-fade-out');
            visibleCard.addEventListener('animationend', function handler() {
                visibleCard.classList.remove('card-fade-out');
                visibleCard.style.display = 'none';
                visibleCard.removeEventListener('animationend', handler); // Clean up listener
                
                if (currentCard) {
                    currentCard.style.display = 'block';
                    // Render content before fade-in to ensure it's there
                    const config = testTypesConfig[currentTestTypeIndex];
                    const resultData = JSON.parse(localStorage.getItem(config.localStorageKey));
                    if (resultData) {
                         renderStatsAndChart(config, resultData, document.getElementById(config.statsElId));
                    } else {
                        clearChart(config);
                    }

                    currentCard.classList.add('card-fade-in');
                    currentCard.addEventListener('animationend', function handler() {
                        currentCard.classList.remove('card-fade-in');
                        currentCard.removeEventListener('animationend', handler); // Clean up listener
                        isTransitioning = false; // Reset flag after animation completes
                    }, { once: true });
                } else {
                    isTransitioning = false; // Reset if there's no new card to show
                }
            }, { once: true });
        } else {
            // No visible card, just show and fade in the new one
            if (currentCard) {
                currentCard.style.display = 'block';
                 const config = testTypesConfig[currentTestTypeIndex];
                const resultData = JSON.parse(localStorage.getItem(config.localStorageKey));
                if (resultData) {
                     renderStatsAndChart(config, resultData, document.getElementById(config.statsElId));
                } else {
                    clearChart(config);
                }
                currentCard.classList.add('card-fade-in');
                currentCard.addEventListener('animationend', function handler() {
                    currentCard.classList.remove('card-fade-in');
                    currentCard.removeEventListener('animationend', handler); // Clean up listener
                    isTransitioning = false; // Reset flag after animation completes
                }, { once: true });
            } else {
                isTransitioning = false; // Reset if there's no new card to show
            }
        }
        
        const config = testTypesConfig[currentTestTypeIndex];
        const resultData = JSON.parse(localStorage.getItem(config.localStorageKey));
        shareButton.disabled = !resultData;
    }
    
    function updateNavigationState() {
        resultCounter.textContent = `${testTypesConfig[currentTestTypeIndex].name}`;
        prevButton.disabled = currentTestTypeIndex === 0;
        nextButton.disabled = currentTestTypeIndex === testTypesConfig.length - 1;
    }

    prevButton.addEventListener('click', () => {
        if (isTransitioning) return; // Ignore clicks if transitioning
        if (currentTestTypeIndex > 0) {
            currentTestTypeIndex--;
            showCurrentCard();
            updateNavigationState();
        }
    });

    nextButton.addEventListener('click', () => {
        if (isTransitioning) return; // Ignore clicks if transitioning
        if (currentTestTypeIndex < testTypesConfig.length - 1) {
            currentTestTypeIndex++;
            showCurrentCard();
            updateNavigationState();
        }
    });

    shareButton.addEventListener('click', shareCurrentResult);
    closeButton.addEventListener('click', closeShareModal);
    shareModal.addEventListener('click', (event) => {
        if (event.target === shareModal) closeShareModal();
    });
    copyShareLinkButton.addEventListener('click', () => {
        copyLinkToClipboard(challengeUrlToCopy);
    });

    loadAndRenderAllResults();
});