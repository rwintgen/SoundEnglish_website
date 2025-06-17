document.addEventListener('DOMContentLoaded', function() {

	const scriptTranslations = document.createElement('script');
	scriptTranslations.src = 'js/translations.js';
	document.head.appendChild(scriptTranslations);

	const scriptHamburger = document.createElement('script');
	scriptHamburger.src = 'js/hamburger.js';
	document.head.appendChild(scriptHamburger);

	const scriptHero = document.createElement('script');
	scriptHero.src = 'js/hero.js';
	document.head.appendChild(scriptHero);

	const scriptMission = document.createElement('script');
	scriptMission.src = 'js/mission.js';
	document.head.appendChild(scriptMission);

	const scriptKeypoints = document.createElement('script');
	scriptKeypoints.src = 'js/keypoints.js';
	document.head.appendChild(scriptKeypoints);

	const scriptServices = document.createElement('script');
	scriptServices.src = 'js/services.js';
	document.head.appendChild(scriptServices);

	const scriptLesson = document.createElement('script');
	scriptLesson.src = 'js/lesson.js';
	document.head.appendChild(scriptLesson);

	const scriptAbout = document.createElement('script');
	scriptAbout.src = 'js/about.js';
	document.head.appendChild(scriptAbout);

	const scriptFAQ = document.createElement('script');
	scriptFAQ.src = 'js/faq.js';
	document.head.appendChild(scriptFAQ);

	// const scriptLanding = document.createElement('script');
	// scriptLanding.src = 'js/landing.js';
	// document.head.appendChild(scriptLanding);

	const scriptPackages = document.createElement('script');
	scriptPackages.src = 'js/packages.js';
	document.head.appendChild(scriptPackages);

	const scriptOverlay = document.createElement('script');
	scriptOverlay.src = 'js/overlay.js';
	document.head.appendChild(scriptOverlay);
});