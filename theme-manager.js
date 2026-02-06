// theme-manager.js
(function() {
    const THEME_STORAGE_KEY = 'websiteTheme';
    const DEFAULT_THEME = 'light'; // Default theme if nothing is stored

    /**
     * Loads the theme preference from localStorage.
     * @returns {string} 'dark' or 'light'
     */
    function loadThemePreference() {
        return localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME;
    }

    /**
     * Applies the given theme to the document body.
     * @param {string} theme 'dark' or 'light'
     */
    function applyTheme(theme) {
        console.log(`Applying theme: ${theme}`); // Debugging line
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }

    /**
     * Toggles the current theme and saves the preference.
     * Applies the new theme immediately.
     */
    function toggleTheme() {
        let currentTheme = loadThemePreference();
        let newTheme = (currentTheme === 'dark') ? 'light' : 'dark';
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
        applyTheme(newTheme);
    }

    // Expose functions to the global scope if needed, or ensure they are called where necessary
    // For this setup, we'll call applyTheme on DOMContentLoaded for every page.
    window.onloadThemePreference = loadThemePreference;
    window.applyTheme = applyTheme;
    window.toggleTheme = toggleTheme;

    // Apply theme on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
        applyTheme(loadThemePreference());
    });
})();
