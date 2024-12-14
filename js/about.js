const aboutButton = document.querySelector('.contentBlock.aboutContact .ctaButton');

if (aboutButton) {
    aboutButton.addEventListener('click', function(event) {
        event.stopPropagation();
        window.open('contact.html', '_blank');
    });
}