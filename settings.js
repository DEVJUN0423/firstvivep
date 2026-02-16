document.addEventListener('DOMContentLoaded', () => {
    const darkModeToggle = document.getElementById('dark-mode-toggle');

    // Initialize toggle state based on current theme
    // window.onloadThemePreference is exposed by theme-manager.js
    if (window.onloadThemePreference() === 'dark') {
        darkModeToggle.checked = true;
    }

    // Add event listener for the toggle
    darkModeToggle.addEventListener('change', () => {
        // window.toggleTheme is exposed by theme-manager.js
        window.toggleTheme();
    });

    // Language select
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
        languageSelect.value = getLanguage();
        languageSelect.addEventListener('change', (event) => {
            setLanguage(event.target.value);
            applyLanguage(event.target.value); // Apply language immediately after selection change
        });
    }

    // Apply language on settings page load
    applyLanguage();
});