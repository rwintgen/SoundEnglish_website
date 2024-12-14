const keypointsButton = document.querySelector('.contentBlock.keyPoints .ctaButton');

if (keypointsButton) {
	keypointsButton.addEventListener('click', function(event) {
		event.stopPropagation();
		window.open('contact.html', '_blank');
	});
}