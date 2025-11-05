// Login page logic
document.addEventListener('DOMContentLoaded', async () => {
    await db.init();
    
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const result = await loginUser(username, password);
        
        if (result.success) {
            setCurrentUser(result.user.id);
            window.location.href = 'dashboard.html';
        } else {
            errorMessage.textContent = result.error;
            errorMessage.style.display = 'block';
        }
    });
});

