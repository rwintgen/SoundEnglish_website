const freeLessonButton = document.querySelector('.contentBlock.freeLesson .ctaButton');

if (freeLessonButton) {
	freeLessonButton.addEventListener('click', function(event) {
		event.stopPropagation();
		window.open('contact.html', '_blank');
	});
}