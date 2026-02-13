document.addEventListener('DOMContentLoaded', () => {
    const heroHeading = document.getElementById('hero-heading');
    const heroDescription = document.getElementById('hero-description');
    const startTestButton = document.getElementById('start-test-button');
    const testList = document.getElementById('test-list');

    // New: Challenge Modal Elements
    const challengeModal = document.getElementById('challenge-modal');
    const challengeCloseButton = challengeModal.querySelector('.close-button');
    const challengeText = document.getElementById('challenge-text');
    const challengeStartButton = document.getElementById('challenge-start-button');

    // Define test data for easy management
    const testsData = {
        'reaction': {
            name: '반응 속도 테스트',
            description: '초록색으로 바뀌면 즉시 클릭하세요!',
            url: 'reaction-test.html'
        },
        'accuracy': {
            name: '마우스 커서 정확도 테스트',
            description: '빨간색 원을 정확하고 빠르게 클릭하세요!',
            url: 'accuracy-test.html'
        },
        'click': { // Corrected from click-speed to match other scripts
            name: '마우스 클릭 속도 테스트',
            description: '정해진 시간 안에 최대한 많이 클릭하세요!',
            url: 'click-test.html'
        },
        'memory': {
            name: '시각적 기억력 테스트',
            description: '표시된 사각형을 기억하고, 사라진 후 클릭하세요!',
            url: 'memory-test.html'
        },
        'coming-soon-1': {
            name: '추가될 기능 2',
            description: '새로운 기능이 곧 찾아옵니다.',
            url: '#'
        },
        'coming-soon-2': {
            name: '추가될 기능 3',
            description: '새로운 기능이 곧 찾아옵니다.',
            url: '#'
        },

    };

    let currentTestId = 'reaction'; // Default selected test

    function updateHeroSection(testId) {
        const testListItem = testList.querySelector(`[data-test-id="${testId}"]`);
        if (testListItem) {
            const testName = testListItem.querySelector('h3').textContent;
            const testDescription = testListItem.querySelector('p').textContent;
            const testUrl = testListItem.dataset.url;

            document.title = `반응 속도 테스트 - ${testName}`;
            heroHeading.textContent = testName;
            heroDescription.textContent = testDescription;
            startTestButton.href = testUrl;
            
            if (testUrl === '#') {
                startTestButton.classList.add('disabled');
                startTestButton.style.pointerEvents = 'none';
            } else {
                startTestButton.classList.remove('disabled');
                startTestButton.style.pointerEvents = 'auto';
            }

            Array.from(testList.children).forEach(li => {
                if (li.dataset.testId === testId) {
                    li.classList.add('selected');
                } else {
                    li.classList.remove('selected');
                }
            });

            currentTestId = testId;
        }
    }

    // New: Function to handle challenge links
    function handleChallenge() {
        const params = new URLSearchParams(window.location.search);
        const challengeDataEncoded = params.get('challenge');

        if (challengeDataEncoded) {
            try {
                const challengeData = JSON.parse(decodeURIComponent(atob(challengeDataEncoded)));
                const testInfo = testsData[challengeData.type];

                if (testInfo) {
                    const message = `친구가 ${testInfo.name}에 도전장을 내밀었습니다!\n\n` +
                                  `기록: ${challengeData.metric} ${challengeData.unit} (등급: ${challengeData.grade})\n\n` +
                                  `이 기록을 뛰어넘을 수 있나요?`;
                    
                    challengeText.innerText = message;
                    challengeStartButton.href = testInfo.url;
                    challengeModal.style.display = 'flex';

                    updateHeroSection(challengeData.type); 
                }
            } catch (e) {
                console.error('잘못된 도전 링크입니다:', e);
            }
        }
    }

    function closeChallengeModal() {
        challengeModal.style.display = 'none';
    }

    testList.addEventListener('click', (event) => {
        const listItem = event.target.closest('li');
        if (listItem && listItem.dataset.testId) {
            updateHeroSection(listItem.dataset.testId);
        }
    });

    // New: Add dblclick listener for direct navigation
    testList.addEventListener('dblclick', (event) => {
        const listItem = event.target.closest('li');
        if (listItem && listItem.dataset.url) {
            const testUrl = listItem.dataset.url;
            if (testUrl !== '#') {
                window.location.href = testUrl;
            } else {
                alert('이 테스트는 아직 준비 중입니다!');
            }
        }
    });

    // New: Event listeners for the challenge modal
    challengeCloseButton.addEventListener('click', closeChallengeModal);
    challengeModal.addEventListener('click', (event) => {
        if (event.target === challengeModal) {
            closeChallengeModal();
        }
    });

    // Smooth scroll for main navigation links
    document.querySelectorAll('.main-nav .nav-item[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1); // Remove '#'
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Carousel Logic for features-grid
    const featuresGrid = document.querySelector('.features-grid');
    const featureCards = document.querySelectorAll('.features-grid .feature-card');
    const prevFeatureBtn = document.getElementById('prev-feature-btn');
    const nextFeatureBtn = document.getElementById('next-feature-btn');

    let currentFeatureIndex = 0;
    const cardsPerPage = 3; // Number of cards to show at once

    function updateCarousel() {
        if (featureCards.length === 0) return;

        // Get the computed style to accurately get the gap
        const featuresGridComputedStyle = window.getComputedStyle(featuresGrid);
        const gap = parseFloat(featuresGridComputedStyle.gap); // '24px' -> 24

        // The cardFullWidth used for translation should be the actual card width plus the gap.
        // Assuming all cards have the same width.
        const cardFullWidth = featureCards[0].offsetWidth + gap; 
        
        // Translate the featuresGrid
        featuresGrid.style.transform = `translateX(-${currentFeatureIndex * cardFullWidth}px)`;

        // Update button states
        prevFeatureBtn.disabled = currentFeatureIndex === 0;
        nextFeatureBtn.disabled = currentFeatureIndex >= featureCards.length - cardsPerPage;

        // Optionally hide buttons when disabled
        prevFeatureBtn.style.opacity = prevFeatureBtn.disabled ? '0.5' : '1';
        nextFeatureBtn.style.opacity = nextFeatureBtn.disabled ? '0.5' : '1';
    }

    prevFeatureBtn.addEventListener('click', () => {
        if (currentFeatureIndex > 0) {
            currentFeatureIndex--;
            updateCarousel();
        }
    });

    nextFeatureBtn.addEventListener('click', () => {
        if (currentFeatureIndex < featureCards.length - cardsPerPage) {
            currentFeatureIndex++;
            updateCarousel();
        }
    });

    // Initial carousel setup
    updateCarousel();

    // Recalculate on window resize
    window.addEventListener('resize', updateCarousel);

    // Add click listeners to feature cards
    featureCards.forEach(card => {
        card.addEventListener('click', () => {
            const testId = card.dataset.testId;
            updateHeroSection(testId);
            // Smooth scroll to the hero section
            const heroSection = document.querySelector('.hero-section');
            if (heroSection) {
                heroSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Mock Leaderboard Data
    const leaderboardData = {
        'reaction': {
            name: '반응 속도 테스트',
            scores: [
                { value: '120 ms', raw: 120 }, // Lower is better
                { value: '150 ms', raw: 150 },
                { value: '180 ms', raw: 180 }
            ],
            unit: 'ms',
            higherIsBetter: false // For sorting/comparison logic, lower is better for reaction time
        },
        'accuracy': {
            name: '정확도 테스트',
            scores: [
                { value: '98%', raw: 98 },
                { value: '95%', raw: 95 },
                { value: '92%', raw: 92 }
            ],
            unit: '%',
            higherIsBetter: true
        },
        'click': {
            name: '클릭 스피드 테스트',
            scores: [
                { value: '16.5 CPS', raw: 16.5 },
                { value: '15.2 CPS', raw: 15.2 },
                { value: '14.1 CPS', raw: 14.1 }
            ],
            unit: 'CPS',
            higherIsBetter: true
        },
        'memory': {
            name: '시각적 기억력 테스트',
            scores: [
                { value: '120 점', raw: 120 },
                { value: '110 점', raw: 110 },
                { value: '100 점', raw: 100 }
            ],
            unit: '점',
            higherIsBetter: true
        }
    };

    const leaderboardGameTitle = document.getElementById('leaderboard-game-title');
    const firstPlaceScoreEl = document.getElementById('first-place-score');
    const secondPlaceScoreEl = document.getElementById('second-place-score');
    const thirdPlaceScoreEl = document.getElementById('third-place-score');

    let currentLeaderboardGameIndex = 0;
    const leaderboardGameIds = Object.keys(leaderboardData); // ['reaction', 'accuracy', 'click', 'memory']

    function updateLeaderboardDisplay(gameId) {
        const gameInfo = leaderboardData[gameId];
        if (!gameInfo) {
            console.warn(`No leaderboard data found for gameId: ${gameId}`);
            return;
        }

        leaderboardGameTitle.textContent = `${gameInfo.name} 글로벌 리더보드`;
        
        // Sort scores to ensure correct 1st, 2nd, 3rd logic
        const sortedScores = [...gameInfo.scores].sort((a, b) => {
            if (gameInfo.higherIsBetter) {
                return b.raw - a.raw; // Higher raw value first
            } else {
                return a.raw - b.raw; // Lower raw value first (e.g., reaction time)
            }
        });

        if (sortedScores[0]) firstPlaceScoreEl.textContent = sortedScores[0].value;
        if (sortedScores[1]) secondPlaceScoreEl.textContent = sortedScores[1].value;
        if (sortedScores[2]) thirdPlaceScoreEl.textContent = sortedScores[2].value;
    }

    // Initial display of leaderboard
    updateLeaderboardDisplay(leaderboardGameIds[currentLeaderboardGameIndex]);

    // Set interval for rotation every 2 seconds
    setInterval(() => {
        currentLeaderboardGameIndex = (currentLeaderboardGameIndex + 1) % leaderboardGameIds.length;
        updateLeaderboardDisplay(leaderboardGameIds[currentLeaderboardGameIndex]);
    }, 2000); // 2 seconds

    // Initial load
    updateHeroSection(currentTestId);
    handleChallenge(); // Check for challenges on page load
});