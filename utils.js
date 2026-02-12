// utils.js - 공통 유틸리티 함수
const AppUtils = (function () {
    /**
     * 고정밀 타임스탬프 반환 (밀리초)
     * performance.now()는 new Date().getTime()보다 정확한 타이밍 제공
     */
    function now() {
        return performance.now();
    }

    /**
     * 양의 정수 검증
     * @param {string|number} value - 검증할 값
     * @param {string} fieldName - 필드명 (에러 메시지용)
     * @param {number} [min=1] - 최소값
     * @returns {number|null} 유효하면 정수 반환, 아니면 null (alert 표시)
     */
    function validatePositiveInt(value, fieldName, min = 1) {
        const parsed = parseInt(value, 10);
        if (isNaN(parsed) || parsed < min) {
            alert(`유효한 ${fieldName}을(를) 입력하세요 (${min} 이상의 숫자).`);
            return null;
        }
        return parsed;
    }

    /**
     * 범용 등급 계산
     * @param {Array<{threshold: number, grade: string}>} thresholds - 오름차순 또는 내림차순 임계값 배열
     * @param {number} value - 평가할 값
     * @param {string} [defaultGrade='F'] - 기본 등급
     * @param {boolean} [lowerIsBetter=true] - true면 값이 작을수록 좋음 (반응속도), false면 클수록 좋음 (CPS)
     * @returns {string} 등급
     */
    function getGrade(thresholds, value, defaultGrade = 'F', lowerIsBetter = true) {
        for (const { threshold, grade } of thresholds) {
            if (lowerIsBetter ? value < threshold : value >= threshold) {
                return grade;
            }
        }
        return defaultGrade;
    }

    /**
     * 테스트 결과 저장 (currentTestResult + 최고 기록 비교)
     * @param {string} bestKey - localStorage 최고 기록 키
     * @param {Object} newResult - 새 결과 객체
     * @param {function} isBetter - (newResult, bestResult) => boolean 비교 함수
     */
    function saveTestResult(bestKey, newResult, isBetter) {
        localStorage.setItem('currentTestResult', JSON.stringify(newResult));

        const bestResult = JSON.parse(localStorage.getItem(bestKey));
        if (!bestResult || isBetter(newResult, bestResult)) {
            localStorage.setItem(bestKey, JSON.stringify(newResult));
        }
    }

    /**
     * fade-out 후 결과 페이지로 이동
     * @param {number} [delay=500] - 페이드아웃 후 이동까지 대기 시간 (ms)
     */
    function navigateToResults(delay = 500) {
        document.body.classList.add('fade-out');
        setTimeout(() => {
            window.location.href = 'results.html';
        }, delay);
    }

    /**
     * 새 결과 객체의 기본 필드 생성
     * @param {string} type - 테스트 타입 ('reaction', 'accuracy', 'click', 'memory')
     * @returns {Object} id, date, type이 포함된 기본 객체
     */
    function createBaseResult(type) {
        return {
            id: Date.now(),
            date: new Date().toLocaleString(),
            type: type
        };
    }

    return {
        now,
        validatePositiveInt,
        getGrade,
        saveTestResult,
        navigateToResults,
        createBaseResult
    };
})();
