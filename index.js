document.addEventListener('DOMContentLoaded', () => {
    const heroHeading = document.getElementById('hero-heading');
    const heroDescription = document.getElementById('hero-description');
    const startTestButton = document.getElementById('start-test-button');
    const testList = document.getElementById('test-list');
    const ctaStartBtn = document.getElementById('cta-start-btn');

    // Challenge Modal Elements
    const challengeModal = document.getElementById('challenge-modal');
    const challengeCloseButton = challengeModal ? challengeModal.querySelector('.close-button') : null;
    const challengeText = document.getElementById('challenge-text');
    const challengeStartButton = document.getElementById('challenge-start-button');

    // Define test data
    const testsData = {
        'reaction': { name: '반응 속도 테스트', description: '초록색으로 바뀌면 즉시 클릭하세요!', url: 'reaction-test.html' },
        'accuracy': { name: '마우스 커서 정확도 테스트', description: '빨간색 원을 정확하고 빠르게 클릭하세요!', url: 'accuracy-test.html' },
        'click': { name: '마우스 클릭 속도 테스트', description: '정해진 시간 안에 최대한 많이 클릭하세요!', url: 'click-test.html' },
        'memory': { name: '시각적 기억력 테스트', description: '표시된 사각형을 기억하고, 사라진 후 클릭하세요!', url: 'memory-test.html' }
    };

    let currentTestId = 'reaction';

    // ========== [#8] Hero Section Update + Feature Card Selected State ==========
    function updateHeroSection(testId) {
        if (!heroHeading || !heroDescription || !startTestButton) return;
        const testData = testsData[testId];
        if (!testData) return;

        document.title = `ClickSpeed - ${testData.name}`;
        heroHeading.textContent = testData.name;
        heroDescription.textContent = testData.description;
        startTestButton.href = testData.url;

        if (testData.url === '#') {
            startTestButton.classList.add('disabled');
            startTestButton.style.pointerEvents = 'none';
        } else {
            startTestButton.classList.remove('disabled');
            startTestButton.style.pointerEvents = 'auto';
        }

        // Update hidden test list
        if (testList) {
            Array.from(testList.children).forEach(li => {
                li.classList.toggle('selected', li.dataset.testId === testId);
            });
        }

        // [#8 Fix] Update feature card selected state
        document.querySelectorAll('.features-grid .feature-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.testId === testId);
        });

        currentTestId = testId;
    }

    // ========== [#4] CTA Button → Navigate to Selected Game Mode ==========
    if (ctaStartBtn) {
        ctaStartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const url = startTestButton ? startTestButton.href : 'reaction-test.html';
            if (url && url !== '#') {
                window.location.href = url;
            }
        });
    }

    // Click area preview
    const clickAreaPreview = document.getElementById('click-area-preview');
    if (clickAreaPreview) {
        clickAreaPreview.addEventListener('click', () => {
            const url = startTestButton ? startTestButton.href : 'click-test.html';
            if (url && url !== '#') window.location.href = url;
        });
    }

    // ========== Challenge Handling ==========
    function handleChallenge() {
        if (!challengeModal) return;
        const params = new URLSearchParams(window.location.search);
        const challengeDataEncoded = params.get('challenge');
        if (!challengeDataEncoded) return;

        try {
            const challengeData = JSON.parse(decodeURIComponent(atob(challengeDataEncoded)));
            const testInfo = testsData[challengeData.type];
            if (testInfo) {
                challengeText.innerText = `친구가 ${testInfo.name}에 도전장을 내밀었습니다!\n\n기록: ${challengeData.metric} ${challengeData.unit} (등급: ${challengeData.grade})\n\n이 기록을 뛰어넘을 수 있나요?`;
                challengeStartButton.href = testInfo.url;
                challengeModal.style.display = 'flex';
                updateHeroSection(challengeData.type);
            }
        } catch (e) {
            console.error('잘못된 도전 링크입니다:', e);
        }
    }

    function closeChallengeModal() {
        if (challengeModal) challengeModal.style.display = 'none';
    }

    if (testList) {
        testList.addEventListener('click', (event) => {
            const li = event.target.closest('li');
            if (li && li.dataset.testId) updateHeroSection(li.dataset.testId);
        });
        testList.addEventListener('dblclick', (event) => {
            const li = event.target.closest('li');
            if (li && li.dataset.url && li.dataset.url !== '#') window.location.href = li.dataset.url;
        });
    }

    if (challengeCloseButton) challengeCloseButton.addEventListener('click', closeChallengeModal);
    if (challengeModal) challengeModal.addEventListener('click', (e) => { if (e.target === challengeModal) closeChallengeModal(); });

    // ========== [#1,#2,#5,#7] Carousel with responsive cardsPerPage, GPU acceleration, dots, touch/swipe ==========
    const featuresGrid = document.querySelector('.features-grid');
    const featureCards = document.querySelectorAll('.features-grid .feature-card');
    const prevFeatureBtn = document.getElementById('prev-feature-btn');
    const nextFeatureBtn = document.getElementById('next-feature-btn');
    const dotsContainer = document.getElementById('feature-carousel-dots');

    if (featuresGrid && featureCards.length > 0 && prevFeatureBtn && nextFeatureBtn) {
        let currentFeatureIndex = 0;

        // [#1 Fix] Responsive cardsPerPage based on screen width
        function getCardsPerPage() {
            if (window.innerWidth <= 768) return 1;
            if (window.innerWidth <= 1024) return 2;
            return 3;
        }

        function getMaxIndex() {
            return Math.max(0, featureCards.length - getCardsPerPage());
        }

        // [#5 Fix] Generate carousel dots
        function generateDots() {
            if (!dotsContainer) return;
            dotsContainer.innerHTML = '';
            const totalDots = getMaxIndex() + 1;
            for (let i = 0; i < totalDots; i++) {
                const dot = document.createElement('span');
                dot.classList.add('carousel-dot');
                if (i === currentFeatureIndex) dot.classList.add('selected');
                dot.addEventListener('click', () => {
                    currentFeatureIndex = i;
                    updateCarousel();
                });
                dotsContainer.appendChild(dot);
            }
        }

        function updateDots() {
            if (!dotsContainer) return;
            dotsContainer.querySelectorAll('.carousel-dot').forEach((dot, i) => {
                dot.classList.toggle('selected', i === currentFeatureIndex);
            });
        }

        // [#2 Fix] GPU-accelerated carousel with will-change
        function updateCarousel() {
            if (currentFeatureIndex > getMaxIndex()) currentFeatureIndex = getMaxIndex();
            if (currentFeatureIndex < 0) currentFeatureIndex = 0;

            // Calculate offset based on card width + gap
            const gapPx = 24;
            const offset = currentFeatureIndex * (featureCards[0].offsetWidth + gapPx);
            featuresGrid.style.transform = `translate3d(-${offset}px, 0, 0)`;

            prevFeatureBtn.disabled = currentFeatureIndex === 0;
            nextFeatureBtn.disabled = currentFeatureIndex >= getMaxIndex();
            prevFeatureBtn.style.opacity = prevFeatureBtn.disabled ? '0.3' : '1';
            nextFeatureBtn.style.opacity = nextFeatureBtn.disabled ? '0.3' : '1';

            updateDots();
        }

        prevFeatureBtn.addEventListener('click', () => {
            if (currentFeatureIndex > 0) { currentFeatureIndex--; updateCarousel(); }
        });

        nextFeatureBtn.addEventListener('click', () => {
            if (currentFeatureIndex < getMaxIndex()) { currentFeatureIndex++; updateCarousel(); }
        });

        // [#7 Fix] Touch/Swipe support
        let touchStartX = 0;
        let touchEndX = 0;
        const swipeThreshold = 50;

        featuresGrid.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        featuresGrid.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0 && currentFeatureIndex < getMaxIndex()) {
                    currentFeatureIndex++;
                    updateCarousel();
                } else if (diff < 0 && currentFeatureIndex > 0) {
                    currentFeatureIndex--;
                    updateCarousel();
                }
            }
        }, { passive: true });

        // Feature card click → update hero + navigate
        featureCards.forEach(card => {
            card.addEventListener('click', () => {
                const testId = card.dataset.testId;
                if (testId) updateHeroSection(testId);
                const heroSection = document.querySelector('.hero-section');
                if (heroSection) heroSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });

        // Responsive recalculation
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                generateDots();
                updateCarousel();
            }, 150);
        });

        generateDots();
        updateCarousel();
    }

    // ========== [#3,#6] Leaderboard: Dynamic Data from localStorage + Auto-rotation with Controls ==========
    const leaderboardGameTitle = document.getElementById('leaderboard-game-title');
    const prevLeaderBtn = document.getElementById('leaderboard-prev-btn');
    const nextLeaderBtn = document.getElementById('leaderboard-next-btn');
    const playPauseBtn = document.getElementById('leaderboard-play-pause-btn');
    const firstPlaceScore = document.getElementById('first-place-score');
    const secondPlaceScore = document.getElementById('second-place-score');
    const thirdPlaceScore = document.getElementById('third-place-score');

    if (leaderboardGameTitle && firstPlaceScore) {
        const leaderboardData = [
            {
                title: '클릭 속도 리더보드',
                key: 'bestClickTestResult',
                unit: 'CPS',
                field: 'cps',
                defaults: [16.8, 14.5, 13.2]
            },
            {
                title: '반응 속도 리더보드',
                key: 'bestReactionTestResult',
                unit: 'ms',
                field: 'average',
                defaults: [142, 178, 205]
            },
            {
                title: '정확도 리더보드',
                key: 'bestAccuracyTestResult',
                unit: '점',
                field: 'score',
                defaults: [98, 85, 72]
            },
            {
                title: '기억력 리더보드',
                key: 'bestMemoryTestResult',
                unit: '점',
                field: 'score',
                defaults: [95, 80, 68]
            }
        ];

        let currentLeaderboardIndex = 0;
        let leaderboardAutoRotate = true;
        let leaderboardInterval = null;

        function updateLeaderboard() {
            const data = leaderboardData[currentLeaderboardIndex];
            leaderboardGameTitle.textContent = data.title;

            // [#3 Fix] Try to get user's best result from localStorage
            let userScore = null;
            try {
                const stored = JSON.parse(localStorage.getItem(data.key));
                if (stored && stored[data.field]) {
                    userScore = parseFloat(stored[data.field]);
                }
            } catch (e) { /* ignore */ }

            const scores = [...data.defaults];
            // If user has a score, insert it into the rankings
            if (userScore !== null && !isNaN(userScore)) {
                if (data.field === 'average') {
                    // Lower is better for reaction time
                    scores.push(userScore);
                    scores.sort((a, b) => a - b);
                } else {
                    scores.push(userScore);
                    scores.sort((a, b) => b - a);
                }
            }

            firstPlaceScore.textContent = scores[0] !== undefined ? scores[0] : '-';
            secondPlaceScore.textContent = scores[1] !== undefined ? scores[1] : '-';
            thirdPlaceScore.textContent = scores[2] !== undefined ? scores[2] : '-';

            // Update leader list rows
            const leaderRows = document.querySelectorAll('.leader-list .leader-row');
            leaderRows.forEach((row, i) => {
                const rankScore = row.querySelector('.rank-score');
                if (rankScore && scores[3 + i] !== undefined) {
                    rankScore.textContent = `${scores[3 + i]} ${data.unit}`;
                }
            });
        }

        // [#6 Fix] Auto-rotation with user control (play/pause/prev/next)
        function startAutoRotate() {
            stopAutoRotate();
            leaderboardInterval = setInterval(() => {
                currentLeaderboardIndex = (currentLeaderboardIndex + 1) % leaderboardData.length;
                updateLeaderboard();
            }, 5000);
        }

        function stopAutoRotate() {
            if (leaderboardInterval) {
                clearInterval(leaderboardInterval);
                leaderboardInterval = null;
            }
        }

        if (prevLeaderBtn) {
            prevLeaderBtn.addEventListener('click', () => {
                currentLeaderboardIndex = (currentLeaderboardIndex - 1 + leaderboardData.length) % leaderboardData.length;
                updateLeaderboard();
                if (leaderboardAutoRotate) startAutoRotate(); // Reset timer
            });
        }

        if (nextLeaderBtn) {
            nextLeaderBtn.addEventListener('click', () => {
                currentLeaderboardIndex = (currentLeaderboardIndex + 1) % leaderboardData.length;
                updateLeaderboard();
                if (leaderboardAutoRotate) startAutoRotate(); // Reset timer
            });
        }

        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => {
                leaderboardAutoRotate = !leaderboardAutoRotate;
                const icon = playPauseBtn.querySelector('i');
                if (icon) {
                    icon.setAttribute('data-lucide', leaderboardAutoRotate ? 'pause' : 'play');
                    lucide.createIcons({ nodes: [icon] });
                }
                if (leaderboardAutoRotate) {
                    startAutoRotate();
                } else {
                    stopAutoRotate();
                }
            });
        }

        updateLeaderboard();
        startAutoRotate();
    }

    // ========== [#3] Stats Section: Load from localStorage ==========
    function loadStats() {
        const bestCps = document.getElementById('best-cps-value');
        const bestReaction = document.getElementById('best-reaction-time-value');
        const bestAccuracy = document.getElementById('best-accuracy-score-value');
        const bestMemory = document.getElementById('best-memory-score-value');

        try {
            const clickResult = JSON.parse(localStorage.getItem('bestClickTestResult'));
            if (clickResult && clickResult.cps && bestCps) bestCps.textContent = clickResult.cps;

            const reactionResult = JSON.parse(localStorage.getItem('bestReactionTestResult'));
            if (reactionResult && reactionResult.average && bestReaction) bestReaction.textContent = Math.round(reactionResult.average) + ' ms';

            const accuracyResult = JSON.parse(localStorage.getItem('bestAccuracyTestResult'));
            if (accuracyResult && accuracyResult.score !== undefined && bestAccuracy) bestAccuracy.textContent = accuracyResult.score;

            const memoryResult = JSON.parse(localStorage.getItem('bestMemoryTestResult'));
            if (memoryResult && memoryResult.score !== undefined && bestMemory) bestMemory.textContent = memoryResult.score;
        } catch (e) { /* ignore parse errors */ }
    }

    loadStats();

    // Initial load
    updateHeroSection(currentTestId);
    handleChallenge();
    applyLanguage(); // Ensure translations are applied on page load
});
