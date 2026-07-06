function googleTranslateElementInit() {
    new google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: 'hi,ta,pa,ur,bn,gu,kn,ml,mr,te,sa,pa,mr,bn',
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false
    }, 'google_translate_element');
}

// Function to ensure language persistence
function persistLanguage() {
    const checkInterval = setInterval(() => {
        const select = document.querySelector('.goog-te-combo');
        if (select) {
            clearInterval(checkInterval);
            
            // Apply saved language if exists
            const savedLang = localStorage.getItem('selectedLanguage');
            if (savedLang && select.value !== savedLang) {
                select.value = savedLang;
                select.dispatchEvent(new Event('change'));
            }

            // Listen for changes and save to localStorage
            select.addEventListener('change', () => {
                localStorage.setItem('selectedLanguage', select.value);
            });
        }
    }, 1000);
}

// Styling the widget for a more professional look
const style = document.createElement('style');
style.innerHTML = `
    #google_translate_element {
        display: inline-block;
        vertical-align: middle;
        height: 35px;
        z-index: 1001;
    }
    .goog-te-gadget {
        font-family: 'Poppins', sans-serif !important;
        color: transparent !important;
        height: 35px !important;
        overflow: hidden;
    }
    .goog-te-gadget .goog-te-combo {
        padding: 5px 8px !important;
        border-radius: 6px !important;
        border: 1px solid #cbd5e1 !important;
        background: #fff !important;
        color: #334155 !important;
        font-weight: 500 !important;
        height: 30px !important;
        font-size: 13px !important;
        cursor: pointer !important;
        outline: none !important;
    }
    /* CRITICAL FIX: Kill the banner frame that covers the navbar */
    iframe.goog-te-banner-frame {
        display: none !important;
        visibility: hidden !important;
    }
    .goog-te-banner-frame.skiptranslate, 
    .goog-te-gadget span,
    .goog-logo-link {
        display: none !important;
    }
    body {
        top: 0 !important;
        position: static !important;
    }
`;
document.head.appendChild(style);

window.addEventListener('load', persistLanguage);
