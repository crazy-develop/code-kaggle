/**
 * Suvidha App Configuration
 * This file contains API keys and other configurations for the frontend.
 */

const JOOBLE_CONFIG = {
    API_KEY: 'd466c825-06e5-4e00-bf37-e822b7ad301b',
    API_URL: 'https://jooble.org/api/'
};

const GOOGLE_CONFIG = {
    API_KEY: 'AIzaSyCgcgDPfDlWwsjKKr7gvpc0LtZG-56K1dY'
};

const GEMINI_CONFIG = {
    API_KEY: 'AIzaSyDnr4Mgix440arZr6qfaCPDYaehI0lPNps'
};

// Exporting globally for non-module scripts
window.JOOBLE_CONFIG = JOOBLE_CONFIG;
window.GOOGLE_CONFIG = GOOGLE_CONFIG;
window.GEMINI_CONFIG = GEMINI_CONFIG;
