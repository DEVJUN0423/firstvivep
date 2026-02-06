document.addEventListener('DOMContentLoaded', () => {
    const prevButton = document.getElementById('prev-result');
    const nextButton = document.getElementById('next-result');
    const resultCounter = document.getElementById('result-counter');

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
            chartInstance: null // Will store Chart.js instance
        },
        {
            id: 'accuracy',
            name: '마우스 정확도 테스트',
            localStorageKey: 'bestAccuracyTestResult',
            cardId: 'accuracy-result-card',
            gradeElId: 'accuracy-grade',
            statsElId: 'accuracy-stats',
            chartCanvasId: 'accuracy-chart-results',
            chartInstance: null
        },
        {
            id: 'click',
            name: '클릭 속도 테스트',
            localStorageKey: 'bestClickTestResult',
            cardId: 'click-speed-result-card',
            gradeElId: 'click-speed-grade',
            statsElId: 'click-speed-stats',
            chartCanvasId: 'click-speed-chart-results',
            chartInstance: null
        },
        {
            id: 'memory',
            name: '시각적 기억력 테스트',
            localStorageKey: 'bestMemoryTestResult',
            cardId: 'memory-result-card',
            gradeElId: 'memory-grade',
            statsElId: 'memory-stats',
            chartCanvasId: 'memory-chart-results',
            chartInstance: null
        }
        // Add more test types here as they are developed
    ];

    let currentTestTypeIndex = 0; // Index for navigating through testTypesConfig

    function loadAndRenderCurrentResult() {
        const currentConfig = testTypesConfig[currentTestTypeIndex];

        // Hide all test result cards first
        document.querySelectorAll('.test-result-item').forEach(card => {
            card.style.display = 'none';
        });

        // Show only the current test type's card
        const resultCardEl = document.getElementById(currentConfig.cardId);
        if (resultCardEl) {
            resultCardEl.style.display = 'block';
        }

        const gradeEl = document.getElementById(currentConfig.gradeElId);
        const statsEl = document.getElementById(currentConfig.statsElId);
        
        const bestResult = JSON.parse(localStorage.getItem(currentConfig.localStorageKey));

        if (bestResult) {
            gradeEl.textContent = `등급: ${bestResult.grade}`;
            
            // Render stats based on test type
            if (currentConfig.id === 'reaction') {
                statsEl.innerHTML = `
                    <p>기록 날짜: ${bestResult.date}</p>
                    <p>평균 반응 속도: ${bestResult.average.toFixed(2)}ms</p>
                `;
                // Reaction chart uses reactionTimes data
                updateChart(currentConfig, bestResult.reactionTimes, 'line', '반응 시간 (ms)', '시도 횟수', 'rgb(75, 192, 192)');
            } else if (currentConfig.id === 'accuracy') {
                statsEl.innerHTML = `
                    <p>기록 날짜: ${bestResult.date}</p>
                    <p>난이도: ${bestResult.difficulty}</p>
                    <p>최종 점수: ${bestResult.score}</p>
                    <p>명중률: ${bestResult.accuracy}%</p>
                    <p>평균 반응 시간: ${bestResult.avgReactionTime}ms</p>
                `;
                // Accuracy chart uses reactionTimes data
                updateChart(currentConfig, bestResult.reactionTimes, 'line', '반응 시간 (ms)', '명중 횟수', 'rgb(255, 99, 132)');
            } else if (currentConfig.id === 'click') {
                statsEl.innerHTML = `
                    <p>기록 날짜: ${bestResult.date}</p>
                    <p>총 클릭 수: ${bestResult.clickCount}</p>
                    <p>테스트 시간: ${bestResult.gameDuration}초</p>
                    <p>초당 클릭 수 (CPS): ${bestResult.cps}</p>
                `;
                // Click speed chart can show CPS as a single bar
                updateChart(currentConfig, [parseFloat(bestResult.cps)], 'bar', '초당 클릭 수', 'CPS', 'rgb(54, 162, 235)');
            } else if (currentConfig.id === 'memory') {
                statsEl.innerHTML = `
                    <p>기록 날짜: ${bestResult.date}</p>
                    <p>최종 점수: ${bestResult.finalScore}</p>
                    <p>정답: ${bestResult.correctClicks}개</p>
                    <p>오답: ${bestResult.incorrectClicks}개</p>
                    <p>격자 크기: ${bestResult.gridSize}x${bestResult.gridSize}</p>
                    <p>표시된 사각형 수: ${bestResult.numToHighlight}개</p>
                `;
                // Memory test could have a bar chart of correct vs incorrect or just display stats
                updateChart(currentConfig, [bestResult.correctClicks, bestResult.incorrectClicks], 'bar', '클릭 수', '정답/오답', ['rgb(40, 167, 69)', 'rgb(220, 53, 69)'], ['정답', '오답']);
            }
        } else {
            gradeEl.textContent = '기록 없음';
            statsEl.innerHTML = `<p>${currentConfig.name} 최고 기록을 달성해보세요!</p>`;
            clearChart(currentConfig);
        }

        updateNavigationState();
    }

    function updateChart(config, data, chartType, labelY, labelX, borderColor) {
        const chartCanvas = document.getElementById(config.chartCanvasId);
        if (!chartCanvas) return;

        // Destroy existing chart instance if it exists
        if (config.chartInstance) {
            config.chartInstance.destroy();
            config.chartInstance = null;
        }

        const ctx = chartCanvas.getContext('2d');
        config.chartInstance = new Chart(ctx, {
            type: chartType,
            data: {
                labels: data.map((_, i) => `${i + 1}`),
                datasets: [{
                    label: labelY,
                    data: data,
                    borderColor: borderColor,
                    backgroundColor: borderColor, // For bar charts
                    tension: chartType === 'line' ? 0.1 : 0,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: labelY }
                    },
                    x: {
                        title: { display: true, text: labelX }
                    }
                },
                plugins: {
                    legend: {
                        display: false
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

    function updateNavigationState() {
        resultCounter.textContent = `${testTypesConfig[currentTestTypeIndex].name} (${currentTestTypeIndex + 1}/${testTypesConfig.length})`;
        prevButton.disabled = currentTestTypeIndex === 0;
        nextButton.disabled = currentTestTypeIndex === testTypesConfig.length - 1;
    }

    prevButton.addEventListener('click', () => {
        if (currentTestTypeIndex > 0) {
            currentTestTypeIndex--;
            loadAndRenderCurrentResult();
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentTestTypeIndex < testTypesConfig.length - 1) {
            currentTestTypeIndex++;
            loadAndRenderCurrentResult();
        }
    });

    // Initial load
    loadAndRenderCurrentResult();
});
