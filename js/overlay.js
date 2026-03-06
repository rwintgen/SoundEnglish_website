const popupBtns = document.querySelectorAll('.popupButton');
const popupOverlay = document.getElementById('popupOverlay');
const popupClose = document.getElementById('popupCloseBtn');

if (popupBtns.length && popupOverlay && popupClose) {
    popupBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            popupOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    popupClose.addEventListener('click', function() {
        popupOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });

    popupOverlay.addEventListener('click', function(e) {
        if (e.target === popupOverlay) {
            popupOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

const dropdown = document.getElementById('popupEventDropdown');
const dropdownBtn = document.getElementById('dropdownSelected');
const dropdownList = document.getElementById('dropdownList');
const dropdownInput = document.getElementById('popupEventInput');

if (dropdown && dropdownBtn && dropdownList && dropdownInput) {
	dropdownBtn.addEventListener('click', function(e) {
		e.stopPropagation();
		dropdown.classList.toggle('open');
	});

	dropdownList.querySelectorAll('li').forEach(function(item) {
		item.addEventListener('click', function(e) {
			e.stopPropagation();
			dropdownBtn.textContent = item.textContent;
			dropdownInput.value = item.getAttribute('data-value');
			dropdown.classList.remove('open');
			dropdownList.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
			item.classList.add('selected');
		});
	});

	document.addEventListener('click', function() {
		dropdown.classList.remove('open');
	});
}

// Firebase is now used instead of Supabase
// Firebase SDK must be loaded in HTML before this script

const popupForm = document.getElementById('popupContactForm');
if (popupForm) {
    popupForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const name = popupForm.querySelector('input[name="name"]');
        const email = popupForm.querySelector('input[name="email"]');
        const eventInput = popupForm.querySelector('input[name="event"]');

        // Validation
        if (!name.value.trim()) {
            name.focus();
            return;
        }
        if (!email.value.trim()) {
            email.focus();
            return;
        }
        if (!eventInput.value.trim()) {
            alert('Please select an event.');
            document.getElementById('dropdownSelected').focus();
            return;
        }

        try {
            // Save to Firebase using global FirebaseService
            if (typeof window.FirebaseService !== 'undefined') {
                const result = await window.FirebaseService.saveContactForm(
                    name.value.trim(), 
                    email.value.trim(), 
                    eventInput.value.trim()
                );

                if (result.success) {
                    alert('Thank you for registering!');
                    popupForm.reset();
                    document.getElementById('dropdownSelected').textContent = 'Select an event';
                    document.getElementById('popupOverlay').classList.remove('active');
                    document.body.style.overflow = '';
                } else {
                    alert('Error submitting form: ' + result.error);
                }
            } else {
                alert('Firebase service not initialized. Please refresh the page.');
                console.error('FirebaseService not available');
            }
        } catch (error) {
            alert('Error submitting form. Please try again.');
            console.error('Form submission error:', error);
        }
    });
}