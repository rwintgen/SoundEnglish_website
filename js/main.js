document.addEventListener('DOMContentLoaded', function() {

	const scriptTranslations = document.createElement('script');
    scriptTranslations.src = 'js/translations.js';
    document.head.appendChild(scriptTranslations);

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

	const scriptFAQ = document.createElement('script');
    scriptFAQ.src = 'js/faq.js';
    document.head.appendChild(scriptFAQ);
});