const heroButton = document.querySelector('.heroSection .ctaButton');

if (heroButton) {
	heroButton.addEventListener('click', function(event) {
		event.stopPropagation();
		window.open('contact.html', '_blank');
	});
}
