// Authentication state management
let currentUser = null;

// Check if user is logged in
const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (token) {
        // Verify token with backend
        fetch('/api/auth/verify', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            currentUser = data.user;
            updateNavigation();
        })
        .catch(err => {
            localStorage.removeItem('token');
            currentUser = null;
            updateNavigation();
        });
    }
};

// Update navigation based on auth state
const updateNavigation = () => {
    const authLinks = document.getElementById('auth-links');
    if (currentUser) {
        authLinks.innerHTML = `
            <a href="/profile">Profile</a>
            <a href="#" onclick="logout()">Logout</a>
        `;
    } else {
        authLinks.innerHTML = `
            <a href="/login">Login</a>
            <a href="/register">Register</a>
        `;
    }
};

// Load content based on route
window.addEventListener('load', checkAuth);
window.addEventListener('popstate', loadContent);

// Load gallery
const loadGallery = async () => {
    try {
        const response = await fetch('/api/artworks');
        const artworks = await response.json();
        const gallery = document.querySelector('.gallery-grid');
        
        gallery.innerHTML = artworks.map(artwork => `
            <div class="artwork-card" onclick="showArtworkDetails(${artwork.id})">
                <img src="${artwork.image_url}" alt="${artwork.title}">
                <div class="artwork-info">
                    <h3>${artwork.title}</h3>
                    <p>By ${artwork.artist_name}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading gallery:', error);
    }
};

// Handle login
const login = async (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (data.token) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            updateNavigation();
            window.location.href = '/gallery';
        }
    } catch (error) {
        console.error('Login error:', error);
    }
};

// Upload artwork
const uploadArtwork = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    try {
        const response = await fetch('/api/artworks', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });
        if (response.ok) {
            window.location.href = '/gallery';
        }
    } catch (error) {
        console.error('Upload error:', error);
    }
};

// Show artwork details
const showArtworkDetails = async (id) => {
    try {
        const response = await fetch(`/api/artworks/${id}`);
        const artwork = await response.json();
        
        document.getElementById('content').innerHTML = `
            <div class="artwork-detail">
                <div class="artwork-image">
                    <img src="${artwork.image_url}" alt="${artwork.title}">
                </div>
                <div class="artwork-info">
                    <h2>${artwork.title}</h2>
                    <p>${artwork.description}</p>
                    <p>By: ${artwork.artist_name}</p>
                    <p>Price: $${artwork.price}</p>
                    ${currentUser ? `
                        <button onclick="likeArtwork(${artwork.id})" class="btn">Like</button>
                        <button onclick="showCommentForm(${artwork.id})" class="btn">Comment</button>
                    ` : ''}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading artwork details:', error);
    }
};
