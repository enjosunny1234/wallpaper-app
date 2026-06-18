// Application State
const state = {
    apiKey: localStorage.getItem('pexels_api_key') || '',
    orientation: 'landscape', // 'landscape' for Desktop, 'portrait' for Mobile
    query: 'abstract aesthetic',
    page: 1,
    isLoading: false
};

// DOM Elements
const elements = {
    modal: document.getElementById('apiKeyModal'),
    app: document.getElementById('app'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    saveApiKeyBtn: document.getElementById('saveApiKeyBtn'),
    gallery: document.getElementById('gallery'),
    searchInput: document.getElementById('searchInput'),
    tabs: document.querySelectorAll('.tab'),
    loader: document.getElementById('loader'),
    settingsBtn: document.getElementById('settingsBtn'),
    
    // Viewer
    viewerModal: document.getElementById('viewerModal'),
    viewerImage: document.getElementById('viewerImage'),
    viewerPhotographer: document.getElementById('viewerPhotographer'),
    downloadBtn: document.getElementById('downloadBtn'),
    closeViewer: document.getElementById('closeViewer')
};

// Initialize Application
function init() {
    if (!state.apiKey) {
        elements.modal.classList.add('active');
    } else {
        elements.app.classList.remove('hidden');
        fetchWallpapers();
    }
    setupEventListeners();
}

// Event Listeners
function setupEventListeners() {
    // API Key Save
    elements.saveApiKeyBtn.addEventListener('click', () => {
        const key = elements.apiKeyInput.value.trim();
        if (key) {
            localStorage.setItem('pexels_api_key', key);
            state.apiKey = key;
            elements.modal.classList.remove('active');
            elements.app.classList.remove('hidden');
            fetchWallpapers();
        }
    });

    // Settings Button (Change API Key)
    elements.settingsBtn.addEventListener('click', () => {
        elements.apiKeyInput.value = state.apiKey;
        elements.modal.classList.add('active');
    });

    // Tabs (Desktop/Mobile)
    elements.tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            elements.tabs.forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            state.orientation = e.currentTarget.dataset.orientation;
            state.page = 1;
            
            // Adjust query based on context if empty
            if(!elements.searchInput.value) {
                 state.query = state.orientation === 'landscape' ? 'desktop wallpaper aesthetic' : 'mobile wallpaper aesthetic';
            }
            
            elements.gallery.innerHTML = '';
            fetchWallpapers();
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
                state.query = state.orientation === 'landscape' ? 'desktop wallpaper aesthetic' : 'mobile wallpaper aesthetic';
            }
            state.page = 1;
            elements.gallery.innerHTML = '';
            fetchWallpapers();
        }, 500);
    });

    // Infinite Scroll
    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
            if (!state.isLoading) {
                state.page++;
                fetchWallpapers();
            }
        }
    });

    // Viewer Close
    elements.closeViewer.addEventListener('click', closeViewer);
    elements.viewerModal.addEventListener('click', (e) => {
        if (e.target === elements.viewerModal) closeViewer();
    });
}

// Fetch Wallpapers from Pexels
async function fetchWallpapers() {
    if (state.isLoading) return;
    
    state.isLoading = true;
    elements.loader.style.display = 'flex';

    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(state.query)}&orientation=${state.orientation}&per_page=30&page=${state.page}`;

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': state.apiKey
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                alert('Invalid API Key. Please update your settings.');
                elements.modal.classList.add('active');
                localStorage.removeItem('pexels_api_key');
                state.apiKey = '';
            }
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        renderGallery(data.photos);
    } catch (error) {
        console.error('Failed to fetch wallpapers:', error);
    } finally {
        state.isLoading = false;
        elements.loader.style.display = 'none';
    }
}

// Render Gallery Elements
function renderGallery(photos) {
    photos.forEach(photo => {
        const card = document.createElement('div');
        card.className = 'wallpaper-card';
        
        // Use large size for display, original for download
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

        card.addEventListener('click', () => openViewer(photo));
        elements.gallery.appendChild(card);
    });
}

// Viewer Logic
function openViewer(photo) {
    elements.viewerImage.src = photo.src.original;
    elements.viewerPhotographer.textContent = photo.photographer;
    elements.downloadBtn.href = photo.src.original;
    elements.downloadBtn.setAttribute('download', `pexels-${photo.id}.jpg`);
    
    elements.viewerModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeViewer() {
    elements.viewerModal.classList.remove('active');
    document.body.style.overflow = 'auto';
    setTimeout(() => {
        elements.viewerImage.src = ''; // Clean up memory
    }, 200);
}

// Start App
init();
