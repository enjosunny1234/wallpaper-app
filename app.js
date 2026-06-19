// Add your Pexels API Key here!
const PEXELS_API_KEY = 'F5WVw4WyF8uxayivPy2fyUl7iatpaRqTOlyE9iCOIQ6e1wB5g46jcE3S';

// Application State
const state = {
    currentUser: JSON.parse(localStorage.getItem('currentUser')) || null,
    users: JSON.parse(localStorage.getItem('users')) || {}, // Mock DB: { 'emailOrPhone': { password, name } }
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
    logoutBtn: document.getElementById('logoutBtn'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    
    // Auth Modal
    authModal: document.getElementById('authModal'),
    authForm: document.getElementById('authForm'),
    authTitle: document.getElementById('authTitle'),
    authSubtitle: document.getElementById('authSubtitle'),
    authName: document.getElementById('authName'),
    authEmailPhone: document.getElementById('authEmailPhone'),
    authPassword: document.getElementById('authPassword'),
    authConfirmPassword: document.getElementById('authConfirmPassword'),
    authError: document.getElementById('authError'),
    authSubmitBtn: document.getElementById('authSubmitBtn'),
    authToggleBtn: document.getElementById('authToggleBtn'),
    authToggleText: document.getElementById('authToggleText'),
    
    // Viewer
    viewerModal: document.getElementById('viewerModal'),
    viewerMediaContainer: document.getElementById('viewerMediaContainer'),
    viewerPhotographer: document.getElementById('viewerPhotographer'),
    downloadBtn: document.getElementById('downloadBtn'),
    closeViewer: document.getElementById('closeViewer')
};

// Initialize Application
function init() {
    setupTheme();
    setupEventListeners();
    checkAuthState();
}

function setupTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        elements.themeToggleBtn.innerHTML = '<i class="ph ph-moon"></i>';
    }
}

function checkAuthState() {
    if (!state.currentUser) {
        elements.app.classList.add('hidden');
        elements.authModal.classList.remove('hidden');
        // Small delay to ensure display:block is applied before adding active for animation
        setTimeout(() => elements.authModal.classList.add('active'), 10);
    } else {
        elements.authModal.classList.remove('active');
        setTimeout(() => elements.authModal.classList.add('hidden'), 300);
        
        elements.app.classList.remove('hidden');
        fetchMedia();
    }
}

// Event Listeners
function setupEventListeners() {
    // --- Theme Toggle ---
    elements.themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        elements.themeToggleBtn.innerHTML = isLight ? '<i class="ph ph-moon"></i>' : '<i class="ph ph-sun"></i>';
    });

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
            
            elements.authConfirmPassword.classList.remove('hidden');
            elements.authConfirmPassword.required = true;
            
            elements.authSubmitBtn.textContent = 'Sign Up';
            elements.authToggleText.textContent = 'Already have an account?';
            elements.authToggleBtn.textContent = 'Sign In';
            
            // Trigger mascot glow effect logic visually via css classes
            elements.authSubmitBtn.classList.add('glow-effect');
        } else {
            state.authMode = 'login';
            elements.authTitle.textContent = 'Sign In';
            elements.authSubtitle.textContent = 'Welcome back to Expressive Wallpapers.';
            
            elements.authName.classList.add('hidden');
            elements.authName.required = false;
            
            elements.authConfirmPassword.classList.add('hidden');
            elements.authConfirmPassword.required = false;
            
            elements.authSubmitBtn.textContent = 'Sign In';
            elements.authToggleText.textContent = "Don't have an account?";
            elements.authToggleBtn.textContent = 'Sign Up';
        }
    });

    elements.authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        elements.authError.classList.add('hidden');
        
        const emailPhone = elements.authEmailPhone.value.trim().toLowerCase();
        const password = elements.authPassword.value.trim();

        if (state.authMode === 'signup') {
            const name = elements.authName.value.trim();
            const confirmPassword = elements.authConfirmPassword.value.trim();

            if (password.length < 8) {
                showAuthError('Password must be at least 8 characters long.');
                return;
            }

            if (password !== confirmPassword) {
                showAuthError('Passwords do not match.');
                return;
            }

            if (state.users[emailPhone]) {
                showAuthError('This Email or Mobile Number is already registered.');
                return;
            }
            
            state.users[emailPhone] = { password, name };
            localStorage.setItem('users', JSON.stringify(state.users));
            state.currentUser = { id: emailPhone, name };
            
        } else {
            // Login Mode
            const user = state.users[emailPhone];
            if (!user || user.password !== password) {
                showAuthError('Invalid Email/Mobile or Password.');
                return;
            }
            state.currentUser = { id: emailPhone, name: user.name };
        }
        
        localStorage.setItem('currentUser', JSON.stringify(state.currentUser));
        elements.authForm.reset();
        checkAuthState();
    });

    elements.logoutBtn.addEventListener('click', () => {
        state.currentUser = null;
        localStorage.removeItem('currentUser');
        elements.gallery.innerHTML = '';
        checkAuthState();
    });

    // --- Main App Listeners ---
    elements.tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            elements.tabs.forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            state.type = e.currentTarget.dataset.type;
            state.orientation = e.currentTarget.dataset.orientation;
            state.page = 1;
            
            if(!elements.searchInput.value) {
                 state.query = state.type === 'videos' ? 'abstract aesthetic loop' 
                             : (state.orientation === 'landscape' ? 'desktop wallpaper aesthetic' : 'mobile wallpaper aesthetic');
            }
            
            elements.gallery.innerHTML = '';
            fetchMedia();
        });
    });

    // Search
    let searchTimeout;
    elements.searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const val = e.target.value.trim();
            if (val) {
                state.query = val;
            } else {
                state.query = state.type === 'videos' ? 'abstract aesthetic loop' 
                          : (state.orientation === 'landscape' ? 'desktop wallpaper aesthetic' : 'mobile wallpaper aesthetic');
            }
            state.page = 1;
            elements.gallery.innerHTML = '';
            fetchMedia();
        }, 500);
    });

    // Infinite Scroll
    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
            if (!state.isLoading && state.currentUser) {
                state.page++;
                fetchMedia();
            }
        }
    });

    // Viewer Close
    elements.closeViewer.addEventListener('click', closeViewer);
    elements.viewerModal.addEventListener('click', (e) => {
        if (e.target === elements.viewerModal) closeViewer();
    });
}

function showAuthError(msg) {
    elements.authError.textContent = msg;
    elements.authError.classList.remove('hidden');
}

// Fetch Media from Pexels
async function fetchMedia() {
    if (state.isLoading) return;
    
    if (PEXELS_API_KEY === 'YOUR_PEXELS_API_KEY_HERE') {
        alert('Developer: Please add your Pexels API Key to the top of app.js');
        return;
    }
    
    state.isLoading = true;
    elements.loader.style.display = 'flex';

    const endpoint = state.type === 'videos' ? 'videos/search' : 'v1/search';
    const url = `https://api.pexels.com/${endpoint}?query=${encodeURIComponent(state.query)}&orientation=${state.orientation}&per_page=30&page=${state.page}`;

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': PEXELS_API_KEY
            }
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const data = await response.json();
        
        if (state.type === 'videos') {
            renderVideoGallery(data.videos);
        } else {
            renderPhotoGallery(data.photos);
        }
    } catch (error) {
        console.error('Failed to fetch media:', error);
    } finally {
        state.isLoading = false;
        elements.loader.style.display = 'none';
    }
}

// Render Photos
function renderPhotoGallery(photos) {
    photos.forEach(photo => {
        const card = document.createElement('div');
        card.className = 'wallpaper-card';
        card.innerHTML = `
            <img src="${photo.src.large2x}" alt="${photo.alt || 'Wallpaper'}" loading="lazy">
            <div class="card-overlay">
                <div class="card-info">
                    <div class="photographer">
                        <i class="ph ph-camera"></i>
                        ${photo.photographer}
                    </div>
                </div>
            </div>
        `;
        card.addEventListener('click', () => openPhotoViewer(photo));
        elements.gallery.appendChild(card);
    });
}

// Render Videos
function renderVideoGallery(videos) {
    videos.forEach(video => {
        const previewVideo = video.video_files.find(f => f.width >= 600 && f.width <= 1200) || video.video_files[0];
        const card = document.createElement('div');
        card.className = 'wallpaper-card';
        card.innerHTML = `
            <div class="video-indicator"><i class="ph-fill ph-play-circle"></i></div>
            <video src="${previewVideo.link}" muted loop autoplay playsinline poster="${video.image}"></video>
            <div class="card-overlay">
                <div class="card-info">
                    <div class="photographer">
                        <i class="ph ph-video-camera"></i>
                        ${video.user.name}
                    </div>
                </div>
            </div>
        `;
        card.addEventListener('click', () => openVideoViewer(video));
        elements.gallery.appendChild(card);
    });
}

// Viewer Logic
function openPhotoViewer(photo) {
    elements.viewerMediaContainer.innerHTML = `<img src="${photo.src.original}" alt="${photo.alt || 'Wallpaper'}">`;
    elements.viewerPhotographer.textContent = photo.photographer;
    elements.downloadBtn.href = photo.src.original;
    elements.downloadBtn.setAttribute('download', `pexels-photo-${photo.id}.jpg`);
    elements.viewerModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function openVideoViewer(video) {
    const hdVideo = video.video_files.find(f => f.quality === 'hd') || video.video_files[0];
    elements.viewerMediaContainer.innerHTML = `<video src="${hdVideo.link}" controls autoplay loop></video>`;
    elements.viewerPhotographer.textContent = video.user.name;
    elements.downloadBtn.href = hdVideo.link;
    elements.downloadBtn.setAttribute('download', `pexels-video-${video.id}.mp4`);
    elements.viewerModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeViewer() {
    elements.viewerModal.classList.remove('active');
    document.body.style.overflow = 'auto';
    setTimeout(() => {
        elements.viewerMediaContainer.innerHTML = ''; 
    }, 200);
}

// Start App
init();
