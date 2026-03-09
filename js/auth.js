// Authentication Module - Desktop Web App
// Handles sign-in/sign-out for the AI homework web app

(function() {
    const modalHTML = `
        <div class="auth-modal" id="authModal">
            <div class="auth-modal-content">
                <button class="auth-close" id="authCloseBtn">&times;</button>
                <div class="auth-modal-header">
                    <h2 id="authTitle">Sign In</h2>
                </div>
                <form id="authForm">
                    <div class="form-group">
                        <label for="authEmail">Email</label>
                        <input type="email" id="authEmail" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="authPassword">Password</label>
                        <input type="password" id="authPassword" name="password" required>
                    </div>
                    <button type="submit" class="auth-submit" id="authSubmit">Sign In</button>
                    <div id="authError" class="auth-error" style="display: none;"></div>
                </form>
            </div>
        </div>
    `;

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuth);
    } else {
        initAuth();
    }

    function initAuth() {
        // Wrap #languageSwitcher in #navActions and add the auth button alongside it
        const langSwitcher = document.getElementById('languageSwitcher');
        if (langSwitcher) {
            const navActions = document.createElement('div');
            navActions.id = 'navActions';
            langSwitcher.parentNode.insertBefore(navActions, langSwitcher);
            navActions.appendChild(langSwitcher);

            const btn = document.createElement('button');
            btn.className = 'auth-button';
            btn.id = 'authButton';
            btn.textContent = 'Sign In';
            navActions.appendChild(btn);
        }

        // Add the sign-in modal to the page body
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);

        // Wait for Firebase to be available
        const waitForFirebase = setInterval(() => {
            if (typeof window.FirebaseService !== 'undefined') {
                clearInterval(waitForFirebase);
                setupAuthListeners();
                checkAuthState();
            }
        }, 100);
    }

    function setupAuthListeners() {
        const authButton = document.getElementById('authButton');
        const authModal = document.getElementById('authModal');
        const authCloseBtn = document.getElementById('authCloseBtn');
        const authForm = document.getElementById('authForm');
        const authSubmit = document.getElementById('authSubmit');
        const authEmail = document.getElementById('authEmail');
        const authPassword = document.getElementById('authPassword');
        const authError = document.getElementById('authError');

        // Open modal
        authButton.addEventListener('click', () => {
            authModal.classList.add('active');
        });

        // Close modal
        authCloseBtn.addEventListener('click', () => {
            authModal.classList.remove('active');
        });

        // Close on background click
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) {
                authModal.classList.remove('active');
            }
        });

        // Form submission
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = authEmail.value.trim();
            const password = authPassword.value;

            // Disable submit button
            authSubmit.disabled = true;
            authSubmit.classList.add('auth-loading');
            authError.style.display = 'none';

            try {
                const result = await window.FirebaseService.signIn(email, password);
                
                if (result.success) {
                    // Close modal
                    authModal.classList.remove('active');
                    authForm.reset();
                    checkAuthState();
                    
                    // Redirect to homework app
                    setTimeout(() => {
                        window.location.href = '/app/index.html';
                    }, 500);
                } else {
                    // Show error
                    authError.textContent = result.error || 'Sign in failed';
                    authError.style.display = 'block';
                }
            } catch (error) {
                authError.textContent = 'An error occurred. Please try again.';
                authError.style.display = 'block';
                console.error('Auth error:', error);
            } finally {
                authSubmit.disabled = false;
                authSubmit.classList.remove('auth-loading');
            }
        });
    }

    function checkAuthState() {
        const authButton = document.getElementById('authButton');
        
        window.FirebaseService.onAuthStateChanged((user) => {
            if (user) {
                // User is signed in
                updateButtonForSignedIn(user);
            } else {
                // User is signed out
                updateButtonForSignedOut();
            }
        });
    }

    function updateButtonForSignedIn(user) {
        const authButton = document.getElementById('authButton');
        const authModal = document.getElementById('authModal');
        
        // Close modal if open
        if (authModal) {
            authModal.classList.remove('active');
        }
        
        // Update button to "Go to App"
        authButton.textContent = 'Go to App';
        authButton.classList.add('go-to-app');
        authButton.id = 'goToAppButton';
        
        // Remove old listener
        const newButton = authButton.cloneNode(true);
        authButton.parentNode.replaceChild(newButton, authButton);
        
        // Navigate to app on click
        newButton.addEventListener('click', () => {
            window.location.href = '/app/index.html';
        });
    }

    function updateButtonForSignedOut() {
        const goToAppBtn = document.getElementById('goToAppButton');
        if (goToAppBtn) {
            const newButton = document.createElement('button');
            newButton.className = 'auth-button';
            newButton.id = 'authButton';
            newButton.textContent = 'Sign In';
            newButton.classList.remove('go-to-app');
            
            goToAppBtn.parentNode.replaceChild(newButton, goToAppBtn);
            
            // Re-setup listeners
            const authModal = document.getElementById('authModal');
            const authCloseBtn = document.getElementById('authCloseBtn');
            const authForm = document.getElementById('authForm');
            
            newButton.addEventListener('click', () => {
                authModal.classList.add('active');
            });

            authCloseBtn.addEventListener('click', () => {
                authModal.classList.remove('active');
            });

            authModal.addEventListener('click', (e) => {
                if (e.target === authModal) {
                    authModal.classList.remove('active');
                }
            });

            authForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('authEmail').value.trim();
                const password = document.getElementById('authPassword').value;
                const authSubmit = document.getElementById('authSubmit');
                const authError = document.getElementById('authError');
                
                authSubmit.disabled = true;
                authSubmit.classList.add('auth-loading');
                authError.style.display = 'none';

                try {
                    const result = await window.FirebaseService.signIn(email, password);
                    if (result.success) {
                        authModal.classList.remove('active');
                        authForm.reset();
                        checkAuthState();
                        setTimeout(() => {
                            window.location.href = '/app/index.html';
                        }, 500);
                    } else {
                        authError.textContent = result.error || 'Sign in failed';
                        authError.style.display = 'block';
                    }
                } catch (error) {
                    authError.textContent = 'An error occurred. Please try again.';
                    authError.style.display = 'block';
                } finally {
                    authSubmit.disabled = false;
                    authSubmit.classList.remove('auth-loading');
                }
            });
        }
    }
})();
