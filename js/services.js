const services = document.querySelectorAll('.service');

function handleServiceClick(event) {
	event.stopPropagation();
	if (this.classList.contains('active')) {
		this.classList.remove('active');
	} else {
		deactivateAllServices();
		this.classList.add('active');
	}
}

function deactivateAllServices() {
	services.forEach(service => service.classList.remove('active'));
}

services.forEach(service => {
	service.addEventListener('click', handleServiceClick);
	const buttons = service.querySelectorAll('button');
	buttons.forEach(button => {
		button.addEventListener('click', function(event) {
			event.stopPropagation();
			window.open('contact.html', '_blank');
		});
	});
});

document.addEventListener('click', deactivateAllServices);