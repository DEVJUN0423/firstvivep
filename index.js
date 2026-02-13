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

    // Carousel Logic for features-grid
    const featuresGrid = document.querySelector('.features-grid');
    const featureCards = document.querySelectorAll('.features-grid .feature-card');
    const prevFeatureBtn = document.getElementById('prev-feature-btn');
    const nextFeatureBtn = document.getElementById('next-feature-btn');

    let currentFeatureIndex = 0;
    const cardsPerPage = 3; // Number of cards to show at once

    function updateCarousel() {
        // Calculate the translation value based on the current index
        // Each card's width + its margin-right (24px)
        // Ensure featureCards[0] exists before accessing offsetWidth
        if (featureCards.length === 0) return;

        const cardWidth = featureCards[0].offsetWidth + 24; // Assuming 24px is the gap
        featuresGrid.style.transform = `translateX(-${currentFeatureIndex * cardWidth}px)`;

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

    // Initial load
    updateHeroSection(currentTestId);
    handleChallenge(); // Check for challenges on page load
});