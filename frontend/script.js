function isLoggedIn() {
    return sessionStorage.getItem('isLoggedIn') === 'true';
}

function getUsers() {
    const users = localStorage.getItem('farmLinkUsers');
    return users ? JSON.parse(users) : [];
}

function saveUsers(users) {
    localStorage.setItem('farmLinkUsers', JSON.stringify(users));
}

function setSectionVisibility(sectionId) {
    const sectionIds = ['login', 'signup', 'home', 'farmer-input', 'analysis', 'recommendation'];

    sectionIds.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
            element.hidden = id !== sectionId;
        }
    });

    document.body.setAttribute('data-theme', sectionId);
}

function syncView() {
    const loginLink = document.getElementById('login-link');
    if (loginLink) {
        loginLink.textContent = isLoggedIn() ? 'Logout' : 'Login';
    }

    if (isLoggedIn()) {
        setSectionVisibility('home');
    } else {
        setSectionVisibility('login');
    }
}

function goToFarmerInput() {
    if (!isLoggedIn()) {
        return;
    }

    setSectionVisibility('farmer-input');
}

function analyze(event) {
    event.preventDefault();

    if (!isLoggedIn()) {
        return;
    }

    const crop = document.getElementById('crop')?.value || 'N/A';
    const quantity = document.getElementById('quantity')?.value || '0';
    const location = document.getElementById('location')?.value || 'N/A';
    const harvestDays = document.getElementById('harvest-days')?.value || '0';

    setSectionVisibility('analysis');

    setTimeout(() => {
        setSectionVisibility('recommendation');
        displayRecommendation(crop, quantity, location, harvestDays);
    }, 2000);
}

function displayRecommendation(crop, quantity, location, harvestDays) {
    const recommendationContent = document.getElementById('recommendation-content');
    if (!recommendationContent) {
        return;
    }

    recommendationContent.innerHTML = `
        <p>Crop: ${crop}</p>
        <p>Quantity: ${quantity} kg</p>
        <p>Recommended Buyer: FreshMart</p>
        <p>Risk: Medium</p>
        <p>Location: ${location}</p>
        <p>Harvest Window: ${harvestDays} days</p>
    `;
}

function performLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username')?.value.trim();
    const password = document.getElementById('password')?.value.trim();

    if (!username || !password) {
        alert('Please enter both username and password.');
        return;
    }

    const users = getUsers();
    const matchingUser = users.find((user) => user.username === username && user.password === password);

    if (!matchingUser) {
        alert('Account not found. Please create a new account first.');
        setSectionVisibility('signup');
        return;
    }

    sessionStorage.setItem('isLoggedIn', 'true');
    alert('Login successful!');
    syncView();
    document.getElementById('login-form')?.reset();
}

function performSignup(event) {
    event.preventDefault();

    const username = document.getElementById('new-username')?.value.trim();
    const password = document.getElementById('new-password')?.value.trim();
    const confirmPassword = document.getElementById('confirm-password')?.value.trim();

    if (!username || !password || !confirmPassword) {
        alert('Please complete all fields.');
        return;
    }

    if (password.length < 4) {
        alert('Password must be at least 4 characters long.');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match.');
        return;
    }

    const users = getUsers();
    const userExists = users.some((user) => user.username === username);

    if (userExists) {
        alert('This username already exists. Please log in or choose another name.');
        return;
    }

    users.push({ username, password });
    saveUsers(users);

    sessionStorage.setItem('isLoggedIn', 'true');
    alert('Account created successfully!');
    document.getElementById('signup-form')?.reset();
    syncView();
}

function logout() {
    sessionStorage.setItem('isLoggedIn', 'false');
    syncView();
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const farmerForm = document.getElementById('farmer-form');
    const loginLink = document.getElementById('login-link');
    const getStartedButton = document.getElementById('get-started-btn');
    const newAnalysisButton = document.getElementById('new-analysis-btn');
    const showSignupButton = document.getElementById('show-signup-btn');
    const showLoginButton = document.getElementById('show-login-btn');

    if (loginForm) {
        loginForm.addEventListener('submit', performLogin);
    }

    if (signupForm) {
        signupForm.addEventListener('submit', performSignup);
    }

    if (farmerForm) {
        farmerForm.addEventListener('submit', analyze);
    }

    if (loginLink) {
        loginLink.addEventListener('click', (event) => {
            if (isLoggedIn()) {
                event.preventDefault();
                logout();
            }
        });
    }

    if (getStartedButton) {
        getStartedButton.addEventListener('click', goToFarmerInput);
    }

    if (newAnalysisButton) {
        newAnalysisButton.addEventListener('click', () => {
            setSectionVisibility('farmer-input');
        });
    }

    if (showSignupButton) {
        showSignupButton.addEventListener('click', () => {
            setSectionVisibility('signup');
        });
    }

    if (showLoginButton) {
        showLoginButton.addEventListener('click', () => {
            setSectionVisibility('login');
        });
    }

    syncView();
});
