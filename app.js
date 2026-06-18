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

    // --- API Key Listeners ---
    elements.saveApiKeyBtn.addEventListener('click', () => {
        const key = elements.apiKeyInput.value.trim();
        if (key) {
            localStorage.setItem('pexels_api_key', key);
            state.apiKey = key;
            checkAuthState();
        }
    });

    elements.settingsBtn.addEventListener('click', () => {
        elements.apiKeyInput.value = state.apiKey;
        elements.welcomeName.textContent = state.currentUser.name;
        elements.apiKeyModal.classList.remove('hidden');
        elements.apiKeyModal.classList.add('active');
    });

    // --- Main App Listeners ---
    elements.tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            elements.tabs.forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            state.type = e.currentTarget.dataset.type;
            state.orientation = e.currentTarget.dataset.orientation;
            state.page = 1;
            
            // Adjust query based on context if empty
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
            if (!state.isLoading && state.currentUser && state.apiKey) {
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

// Fetch Media from Pexels (Photos or Videos)
async function fetchMedia() {
    if (state.isLoading || !state.apiKey) return;
    
    state.isLoading = true;
    elements.loader.style.display = 'flex';

    const endpoint = state.type === 'videos' ? 'videos/search' : 'v1/search';
    const url = `https://api.pexels.com/${endpoint}?query=${encodeURIComponent(state.query)}&orientation=${state.orientation}&per_page=30&page=${state.page}`;

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': state.apiKey
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                alert('Invalid API Key. Please update your settings.');
                state.apiKey = '';
                localStorage.removeItem('pexels_api_key');
                checkAuthState();
            }
            throw new Error(`API Error: ${response.status}`);
        }

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
        
        const displaySrc = photo.src.large2x;
        
        card.innerHTML = `
            <img src="${displaySrc}" alt="${photo.alt || 'Wallpaper'}" loading="lazy">
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
        // Find a decent resolution for thumbnail/preview
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
    // Find the highest resolution HD file for the viewer
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
        elements.viewerMediaContainer.innerHTML = ''; // Clean up memory and stop video audio
    }, 200);
}

// Start App
init();
