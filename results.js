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
            metricUnit: 'ms',
            renderStats(data) {
                return `<p>기록 날짜: ${data.date}</p><p>평균 반응 속도: ${data.average.toFixed(2)}ms</p>`;
            },
            getChartConfig(data) {
                return {
                    type: 'line',
                    data: {
                        labels: data.reactionTimes.map((_, i) => `시도 ${i + 1}`),
                        datasets: [{ label: '반응 시간 (ms)', data: data.reactionTimes }]
                    }
                };
            }
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
            metricUnit: '점',
            renderStats(data) {
                return `<p>기록 날짜: ${data.date}</p><p>난이도: ${data.difficulty}</p><p>최종 점수: ${data.score}</p><p>명중률: ${data.accuracy}%</p><p>평균 반응 시간: ${data.avgReactionTime}ms</p>`;
            },
            getChartConfig(data) {
                return {
                    type: 'line',
                    data: {
                        labels: data.reactionTimes.map((_, i) => `명중 ${i + 1}`),
                        datasets: [{ label: '반응 시간 (ms)', data: data.reactionTimes }]
                    }
                };
            }
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
            metricUnit: 'CPS',
            renderStats(data) {
                return `<p>기록 날짜: ${data.date}</p><p>총 클릭 수: ${data.clickCount}</p><p>테스트 시간: ${data.gameDuration}초</p><p>초당 클릭 수 (CPS): ${data.cps}</p>`;
            },
            getChartConfig(data) {
                return {
                    type: 'bar',
                    data: {
                        labels: ['CPS'],
                        datasets: [{ label: '초당 클릭 수', data: [parseFloat(data.cps)] }]
                    }
                };
            }
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
            metricUnit: '점',
            renderStats(data) {
                return `<p>기록 날짜: ${data.date}</p><p>최종 점수: ${data.finalScore}</p><p>총 정답: ${data.totalCorrectClicks}개</p><p>총 오답: ${data.totalIncorrectClicks}개</p><p>난이도: ${data.gridSize}x${data.gridSize}</p><p>기억 시간: ${data.recallDuration}초</p>`;
            },
            getChartConfig(data) {
                return {
                    type: 'bar',
                    data: {
                        labels: ['정답', '오답'],
                        datasets: [{
                            label: '클릭 수',
                            data: [data.totalCorrectClicks, data.totalIncorrectClicks],
                            backgroundColor: ['rgb(75, 192, 192)', 'rgb(255, 99, 132)']
                        }]
                    }
                };
            }
        }
    ];

    let currentTestTypeIndex = 0;
    let challengeUrlToCopy = '';
    let isTransitioning = false;

    // --- Comparison & Sharing ---

    function renderComparisonMessage(currentResult, bestResult, config) {
        const resultCardEl = document.getElementById(config.cardId);
        if (!resultCardEl) return;
        const existingMsg = resultCardEl.querySelector('.comparison-message');
        if (existingMsg) existingMsg.remove();
        const gradeEl = document.getElementById(config.gradeElId);
        if (!gradeEl) return;

        const currentMetric = currentResult[config.comparisonMetric];
        const bestMetric = bestResult[config.comparisonMetric];
        const isNewBest = (config.comparisonMetric === 'average')
            ? currentMetric < bestMetric
            : currentMetric > bestMetric;

        let message;
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

    // --- Share Modal ---

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

    // --- Chart ---

    function updateChart(config, chartConfig) {
        const chartCanvas = document.getElementById(config.chartCanvasId);
        if (!chartCanvas) return;
        if (config.chartInstance) config.chartInstance.destroy();

        const ctx = chartCanvas.getContext('2d');
        const chartType = chartConfig.type;

        config.chartInstance = new Chart(ctx, {
            type: chartType,
            data: chartConfig.data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 500,
                    easing: 'easeOutQuart',
                    x: { from: chartType === 'line' ? 0 : undefined },
                    y: { from: chartType === 'bar' ? 0 : undefined }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: chartConfig.data.datasets.length === 1, text: chartConfig.data.datasets[0].label }
                    },
                    x: { title: { display: false } }
                },
                plugins: {
                    legend: {
                        display: chartConfig.data.datasets.length > 1 || chartType === 'bar',
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

    // --- Rendering ---

    function renderStatsAndChart(config, resultData, statsEl) {
        statsEl.innerHTML = config.renderStats(resultData);
        updateChart(config, config.getChartConfig(resultData));
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

    // --- Card Transition ---

    function fadeInCard(card, config) {
        card.style.display = 'block';

        const resultData = JSON.parse(localStorage.getItem(config.localStorageKey));
        if (resultData) {
            renderStatsAndChart(config, resultData, document.getElementById(config.statsElId));
        } else {
            clearChart(config);
        }

        card.classList.add('card-fade-in');
        card.addEventListener('animationend', function handler() {
            card.classList.remove('card-fade-in');
            card.removeEventListener('animationend', handler);
            isTransitioning = false;
        }, { once: true });
    }

    function showCurrentCard(animate = true) {
        if (isTransitioning && animate) return;

        const allCards = document.querySelectorAll('.test-result-item');
        const currentCard = document.getElementById(testTypesConfig[currentTestTypeIndex].cardId);
        const config = testTypesConfig[currentTestTypeIndex];

        if (!animate) {
            allCards.forEach(card => card.style.display = 'none');
            if (currentCard) {
                currentCard.style.display = 'block';
                const resultData = JSON.parse(localStorage.getItem(config.localStorageKey));
                if (resultData) {
                    renderStatsAndChart(config, resultData, document.getElementById(config.statsElId));
                } else {
                    clearChart(config);
                }
            }
            shareButton.disabled = !JSON.parse(localStorage.getItem(config.localStorageKey));
            return;
        }

        isTransitioning = true;

        const visibleCard = Array.from(allCards).find(card => card.style.display === 'block');
        if (visibleCard) {
            visibleCard.classList.add('card-fade-out');
            visibleCard.addEventListener('animationend', function handler() {
                visibleCard.classList.remove('card-fade-out');
                visibleCard.style.display = 'none';
                visibleCard.removeEventListener('animationend', handler);

                if (currentCard) {
                    fadeInCard(currentCard, config);
                } else {
                    isTransitioning = false;
                }
            }, { once: true });
        } else if (currentCard) {
            fadeInCard(currentCard, config);
        } else {
            isTransitioning = false;
        }

        shareButton.disabled = !JSON.parse(localStorage.getItem(config.localStorageKey));
    }

    // --- Navigation ---

    function updateNavigationState() {
        resultCounter.textContent = testTypesConfig[currentTestTypeIndex].name;
        prevButton.disabled = currentTestTypeIndex === 0;
        nextButton.disabled = currentTestTypeIndex === testTypesConfig.length - 1;
    }

    function navigate(direction) {
        if (isTransitioning) return;
        const newIndex = currentTestTypeIndex + direction;
        if (newIndex >= 0 && newIndex < testTypesConfig.length) {
            currentTestTypeIndex = newIndex;
            showCurrentCard();
            updateNavigationState();
        }
    }

    // --- Init ---

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
            const isCurrent = currentTestResult && currentTestResult.type === config.id;
            renderCard(config, isCurrent ? currentTestResult : null);
        });

        updateNavigationState();
        showCurrentCard(false);

        if (testJustCompleted) {
            localStorage.removeItem('currentTestResult');
        }
    }

    // --- Event Listeners ---

    prevButton.addEventListener('click', () => navigate(-1));
    nextButton.addEventListener('click', () => navigate(1));
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
