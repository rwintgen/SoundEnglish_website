const missionButton = document.querySelector('.contentBlock.mission .ctaButton');

if (missionButton) {
	missionButton.addEventListener('click', function(event) {
		event.stopPropagation();
		window.open('contact.html', '_blank');
	});
}