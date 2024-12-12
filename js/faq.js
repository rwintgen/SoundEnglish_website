const faqItems = document.querySelectorAll('.faqItem');

function handleFaqClick(event) {
    event.stopPropagation();
    if (this.classList.contains('active')) {
        this.classList.remove('active');
    } else {
        this.classList.add('active');
    }
}

faqItems.forEach(item => {
    item.addEventListener('click', handleFaqClick);
    const answer = item.querySelector('.answer');
    if (answer) {
        answer.addEventListener('click', function(event) {
            event.stopPropagation();
        });
    }
});