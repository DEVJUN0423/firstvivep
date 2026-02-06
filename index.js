document.addEventListener('DOMContentLoaded', () => {
    const heroHeading = document.getElementById('hero-heading');
    const heroDescription = document.getElementById('hero-description');
    const startTestButton = document.getElementById('start-test-button');
    const testList = document.getElementById('test-list');

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
        'click-speed': {
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
            description: '새로운 기능이 곧 찾아옵니다.', // Corrected typo here
            url: '#'
        },

    };

    let currentTestId = 'reaction'; // Default selected test

    // Function to update the hero section based on the selected test
    function updateHeroSection(testId) {
        const test = testsData[testId];
        if (test) {
            document.title = `반응 속도 테스트 - ${test.name}`; // Update page title
            heroHeading.textContent = test.name;
            heroDescription.textContent = test.description;
            startTestButton.href = test.url;
            
            // Disable start button if URL is '#' (coming soon)
            if (test.url === '#') {
                startTestButton.classList.add('disabled');
                startTestButton.style.pointerEvents = 'none'; // Make it unclickable
            } else {
                startTestButton.classList.remove('disabled');
                startTestButton.style.pointerEvents = 'auto';
            }

            // Update active state in the test list
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

    // Event listener for clicks on the test list
    testList.addEventListener('click', (event) => {
        const listItem = event.target.closest('li');
        if (listItem && listItem.dataset.testId) {
            updateHeroSection(listItem.dataset.testId);
        }
    });

    // Initial load: set the default test
    updateHeroSection(currentTestId);
});
