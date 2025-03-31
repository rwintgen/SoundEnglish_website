document.getElementById("landingMainCta1").addEventListener("click", function () {
	const target = document.getElementById("contactSection1");
	const offset = 100;
	const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;

	window.scrollTo({
		top: targetPosition,
		behavior: "smooth"
	});
});

document.getElementById("landingMainCta2").addEventListener("click", function () {
	const target = document.getElementById("contactSection2");
	const offset = 100;
	const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;

	window.scrollTo({
		top: targetPosition,
		behavior: "smooth"
	});
});