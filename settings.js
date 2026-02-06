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

    // Language select (for future expansion)
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
        // Example: load saved language preference
        // const savedLang = localStorage.getItem('websiteLanguage') || 'ko';
        // languageSelect.value = savedLang;

        // languageSelect.addEventListener('change', (event) => {
        //     localStorage.setItem('websiteLanguage', event.target.value);
        //     // Optionally, refresh page or update content dynamically
        // });
    }
});