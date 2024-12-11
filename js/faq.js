const faqItems = document.querySelectorAll('.faqItem');

function handleFaqClick(event) {
    event.stopPropagation();
    if (this.classList.contains('active')) {
        this.classList.remove('active');
    } else {
        this.classList.add('active');
    }
}

function deactivateAllFaqs() {
    faqItems.forEach(item => item.classList.remove('active'));
}

faqItems.forEach(item => {
    item.addEventListener('click', handleFaqClick);
});
