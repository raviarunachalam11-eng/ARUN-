// Register page logic
document.addEventListener('DOMContentLoaded', async () => {
    await db.init();
    
    const registerForm = document.getElementById('register-form');
    const errorMessage = document.getElementById('error-message');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (password !== confirmPassword) {
            errorMessage.textContent = 'Passwords do not match';
            errorMessage.style.display = 'block';
            return;
        }

        if (password.length < 4) {
            errorMessage.textContent = 'Password must be at least 4 characters long';
            errorMessage.style.display = 'block';
            return;
        }

        const result = await registerUser(username, password);
        
        if (result.success) {
            setCurrentUser(result.userId);
            window.location.href = 'dashboard.html';
        } else {
            errorMessage.textContent = result.error;
            errorMessage.style.display = 'block';
        }
    });
});

