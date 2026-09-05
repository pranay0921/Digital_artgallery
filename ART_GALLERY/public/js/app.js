(async function(){
    const token = localStorage.getItem('token');
    const authLink = document.getElementById('authLink');
    const profileLink = document.getElementById('profileLink');
    const uploadLink = document.getElementById('uploadLink');

    // Update auth state in navigation
    if(authLink) {
        authLink.textContent = token ? 'Logout' : 'Login';
        authLink.addEventListener('click', (e) => {
            if(token) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'index.html';
            }
        });
    }

    // Load gallery if on home page
    const galleryEl = document.getElementById('gallery');
    if(galleryEl) {
        loadGallery();
    }

    // Handle category filter changes
    const categoryFilter = document.getElementById('categoryFilter');
    if(categoryFilter) {
        categoryFilter.addEventListener('change', loadGallery);
    }
})();

// Gallery loading function
async function loadGallery() {
    const galleryEl = document.getElementById('gallery');
    const tpl = document.getElementById('cardTpl');
    const category = document.getElementById('categoryFilter')?.value || 'all';
    
    try {
        const response = await fetch(`/api/artworks${category !== 'all' ? '?category=' + category : ''}`);
        const artworks = await response.json();
        
        galleryEl.innerHTML = '';
        artworks.forEach(artwork => {
            const card = tpl.content.cloneNode(true);
            card.querySelector('.artImg').src = artwork.image_url;
            card.querySelector('.title').textContent = artwork.title;
            card.querySelector('.artist').textContent = `By: ${artwork.artist_name}`;
            card.querySelector('.desc').textContent = artwork.description;
            card.querySelector('.likes').textContent = artwork.likes || 0;
            galleryEl.appendChild(card);
        });
    } catch (error) {
        console.error('Failed to load gallery:', error);
        galleryEl.innerHTML = '<p class="error">Failed to load artworks</p>';
    }
}
