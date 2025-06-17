const popupBtn = document.getElementById('popupButton');
const popupOverlay = document.getElementById('popupOverlay');
const popupClose = document.getElementById('popupCloseBtn');

if (popupBtn && popupOverlay && popupClose) {
    popupBtn.addEventListener('click', function() {
        popupOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
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

const supabaseUrl = 'https://zlbbywikacnyjwccjrqk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsYmJ5d2lrYWNueWp3Y2NqcnFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNzA0NjksImV4cCI6MjA2NTc0NjQ2OX0.ry9L10j5bc5ULUrsutFZStMHyX6S-BJTPYui7mnih4o';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

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
            document.getElementById('dropdownSelected').focus();
            return;
        }

        // Supabase insert
        const { error } = await supabase
            .from('event_registrations')
            .insert([{ 
                name: name.value.trim(), 
                email: email.value.trim(), 
                event: eventInput.value.trim() 
            }]);

        if (error) {
            alert('Error submitting form. Please try again.');
        } else {
            alert('Thank you for registering!');
            popupForm.reset();
            document.getElementById('dropdownSelected').textContent = 'Select an event';
            document.getElementById('popupOverlay').classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}