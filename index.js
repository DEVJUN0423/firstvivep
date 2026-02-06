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
        const test = testsData[testId];
        if (test) {
            document.title = `반응 속도 테스트 - ${test.name}`;
            heroHeading.textContent = test.name;
            heroDescription.textContent = test.description;
            startTestButton.href = test.url;
            
            if (test.url === '#') {
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
                    
                    challengeText.innerText = message; // Use innerText to respect newlines
                    challengeStartButton.href = testInfo.url;
                    challengeModal.style.display = 'flex';

                    // Also update the main page hero to the challenged test
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

    // New: Event listeners for the challenge modal
    challengeCloseButton.addEventListener('click', closeChallengeModal);
    challengeModal.addEventListener('click', (event) => {
        if (event.target === challengeModal) {
            closeChallengeModal();
        }
    });

    // Initial load
    updateHeroSection(currentTestId);
    handleChallenge(); // Check for challenges on page load
});