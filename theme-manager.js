// theme-manager.js
(function() {
    const THEME_STORAGE_KEY = 'websiteTheme';
    const DEFAULT_THEME = 'light';

    function loadThemePreference() {
        return localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME;
    }

    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }

    function toggleTheme() {
        const currentTheme = loadThemePreference();
        const newTheme = (currentTheme === 'dark') ? 'light' : 'dark';
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
        applyTheme(newTheme);
    }

    window.onloadThemePreference = loadThemePreference;
    window.toggleTheme = toggleTheme;

    document.addEventListener('DOMContentLoaded', () => {
        applyTheme(loadThemePreference());
    });
})();
