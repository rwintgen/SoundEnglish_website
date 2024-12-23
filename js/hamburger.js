document.getElementById('hamburger').addEventListener('click', function(event) {
    event.stopPropagation();
    var navBar = document.getElementById('navBar');
    var hamburger = document.getElementById('hamburger');
    if (navBar.classList.contains('show')) {
        navBar.classList.remove('show');
        hamburger.classList.remove('rotate');
        document.body.style.overflow = '';
    } else {
        navBar.classList.add('show');
        hamburger.classList.add('rotate');
        document.body.style.overflow = 'hidden';
    }
});

document.getElementById('navBar').addEventListener('touchmove', function(event) {
    event.preventDefault();
}, { passive: false });

document.addEventListener('click', function(event) {
    var navBar = document.getElementById('navBar');
    var hamburger = document.getElementById('hamburger');
    if (navBar.classList.contains('show') && !navBar.contains(event.target)) {
        navBar.classList.remove('show');
        hamburger.classList.remove('rotate');
        document.body.style.overflow = '';
    }
});