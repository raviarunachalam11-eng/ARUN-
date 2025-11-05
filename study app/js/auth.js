// Authentication functions
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
}

async function registerUser(username, password) {
    try {
        await db.init();
        
        // Check if user already exists
        const existingUser = await db.getByIndex('users', 'username', username);
        if (existingUser) {
            return { success: false, error: 'Username already exists' };
        }

        const hashedPassword = hashPassword(password);
        const userId = await db.add('users', {
            username,
            password: hashedPassword
        });

        return { success: true, userId };
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, error: 'Registration failed' };
    }
}

async function loginUser(username, password) {
    try {
        await db.init();
        
        const user = await db.getByIndex('users', 'username', username);
        if (!user) {
            return { success: false, error: 'Invalid username or password' };
        }

        const hashedPassword = hashPassword(password);
        if (user.password === hashedPassword) {
            return { success: true, user };
        }

        return { success: false, error: 'Invalid username or password' };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: 'Login failed' };
    }
}

function getCurrentUser() {
    const userId = localStorage.getItem('userId');
    return userId ? parseInt(userId) : null;
}

function setCurrentUser(userId) {
    localStorage.setItem('userId', userId.toString());
}

function logout() {
    localStorage.removeItem('userId');
}

function requireAuth() {
    const userId = getCurrentUser();
    if (!userId) {
        window.location.href = 'index.html';
        return null;
    }
    return userId;
}

