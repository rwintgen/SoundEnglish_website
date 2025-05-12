const packagesHeaders = document.querySelectorAll('#packagesHeaders h4');
const packageCards = document.querySelectorAll('.packageCard');

packagesHeaders.forEach((header, index) => {
	header.addEventListener('click', () => {
		packagesHeaders.forEach(h => h.classList.remove('active'));
		packageCards.forEach(card => card.classList.remove('active'));

		header.classList.add('active');
		packageCards[index].classList.add('active');
	});
});gi