document.getElementById('hamburger').addEventListener('click', function(event) {
    event.stopPropagation();
    var navBar = document.getElementById('navBar');
    if (navBar.classList.contains('show')) {
        navBar.classList.remove('show');
        document.body.style.overflow = '';
    } else {
        navBar.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
});

document.getElementById('navBar').addEventListener('touchmove', function(event) {
    event.preventDefault();
}, { passive: false });

document.addEventListener('click', function(event) {
    var navBar = document.getElementById('navBar');
    if (navBar.classList.contains('show') && !navBar.contains(event.target)) {
        navBar.classList.remove('show');
        document.body.style.overflow = '';
    }
});