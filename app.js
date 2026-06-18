// Application State
const state = {
    apiKey: localStorage.getItem('pexels_api_key') || '',
    currentUser: JSON.parse(localStorage.getItem('currentUser')) || null,
    users: JSON.parse(localStorage.getItem('users')) || {}, // Mock DB: { email: { password, name } }
    type: 'photos', // 'photos' or 'videos'
    orientation: 'landscape', // 'landscape' for Desktop, 'portrait' for Mobile
    query: 'abstract aesthetic',
    page: 1,
    isLoading: false,
    authMode: 'login' // 'login' or 'signup'
};

// DOM Elements
const elements = {
    app: document.getElementById('app'),
    gallery: document.getElementById('gallery'),
    searchInput: document.getElementById('searchInput'),
    tabs: document.querySelectorAll('.tab'),
    loader: document.getElementById('loader'),
    settingsBtn: document.getElementById('settingsBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    
    // Auth Modal
    authModal: document.getElementById('authModal'),
    authForm: document.getElementById('authForm'),
    authTitle: document.getElementById('authTitle'),
    authSubtitle: document.getElementById('authSubtitle'),
    authName: document.getElementById('authName'),
    authEmail: document.getElementById('authEmail'),
    authPassword: document.getElementById('authPassword'),
    authError: document.getElementById('authError'),
    authSubmitBtn: document.getElementById('authSubmitBtn'),
    authToggleBtn: document.getElementById('authToggleBtn'),
    authToggleText: document.getElementById('authToggleText'),
    
    // API Key Modal
    apiKeyModal: document.getElementById('apiKeyModal'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    saveApiKeyBtn: document.getElementById('saveApiKeyBtn'),
    welcomeName: document.getElementById('welcomeName'),
    
    // Viewer
    viewerModal: document.getElementById('viewerModal'),
    viewerMediaContainer: document.getElementById('viewerMediaContainer'),
    viewerPhotographer: document.getElementById('viewerPhotographer'),
    downloadBtn: document.getElementById('downloadBtn'),
    closeViewer: document.getElementById('closeViewer')
};

// Initialize Application
function init() {
    setupEventListeners();
    checkAuthState();
}

function checkAuthState() {
    if (!state.currentUser) {
        elements.app.classList.add('hidden');
        elements.apiKeyModal.classList.add('hidden');
        elements.authModal.classList.remove('hidden');
        elements.authModal.classList.add('active');
    } else {
        elements.authModal.classList.remove('active');
        elements.authModal.classList.add('hidden');
        
        if (!state.apiKey) {
            elements.welcomeName.textContent = state.currentUser.name;
            elements.apiKeyModal.classList.remove('hidden');
            elements.apiKeyModal.classList.add('active');
        } else {
            elements.apiKeyModal.classList.remove('active');
            elements.apiKeyModal.classList.add('hidden');
            elements.app.classList.remove('hidden');
            fetchMedia();
        }
    }
}

// Event Listeners
function setupEventListeners() {
    // --- Auth Listeners ---
    elements.authToggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        elements.authError.classList.add('hidden');
        if (state.authMode === 'login') {
            state.authMode = 'signup';
            elements.authTitle.textContent = 'Create Account';
            elements.authSubtitle.textContent = 'Join to explore amazing wallpapers.';
            elements.authName.classList.remove('hidden');
            elements.authName.required = true;
            elements.authSubmitBtn.textContent = 'Sign Up';
            elements.authToggleText.textContent = 'Already have an account?';
            elements.authToggleBtn.textContent = 'Sign In';
        } else {
            state.authMode = 'login';
            elements.authTitle.textContent = 'Sign In';
            elements.authSubtitle.textContent = 'Welcome back to Expressive Wallpapers.';
            elements.authName.classList.add('hidden');
            elements.authName.required = false;
            elements.authSubmitBtn.textContent = 'Sign In';
            elements.authToggleText.textContent = "Don't have an account?";
            elements.authToggleBtn.textContent = 'Sign Up';
        }
    });

    elements.authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        elements.authError.classList.add('hidden');
        const email = elements.authEmail.value.trim();
        const password = elements.authPassword.value.trim();
        const name = elements.authName.value.trim();

        if (state.authMode === 'signup') {
            if (state.users[email]) {
                elements.authError.textContent = 'Account already exists.';
                elements.authError.classList.remove('hidden');
                return;
            }
            state.users[email] = { password, name };
            localStorage.setItem('users', JSON.stringify(state.users));
            state.currentUser = { email, name };
        } else {
            const user = state.users[email];
            if (!user || user.password !== password) {
                elements.authError.textContent = 'Invalid email or password.';
                elements.authError.classList.remove('hidden');
                return;
            }
            state.currentUser = { email, name: user.name };
        }
        
        localStorage.setItem('currentUser',
        JSON.stringify(state.currentUser));
        elements.authForm.reset();
        checkAuthState();
    });
}
init();
