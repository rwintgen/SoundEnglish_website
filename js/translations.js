    const languageSwitcher = document.getElementById('languageSwitcher');
    const defaultLanguage = 'en';
    let currentLanguage = localStorage.getItem('language') || defaultLanguage;

    function loadTranslations(language) {
        fetch(`lang/${language}.json`)
            .then(response => response.json())
            .then(translations => {
                applyTranslations(translations);
                localStorage.setItem('language', language);
            })
            .catch(error => console.error('Error loading translations:', error));
    }

    function applyTranslations(translations) {
        document.title = translations.title;
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            if (translations[key]) {
                element.innerHTML = translations[key];
            }
        });
    }

    languageSwitcher.addEventListener('change', function() {
        currentLanguage = this.value;
        loadTranslations(currentLanguage);
    });

    loadTranslations(currentLanguage);
