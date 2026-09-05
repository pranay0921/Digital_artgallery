document.addEventListener('DOMContentLoaded', async () => {
    const gallery = document.getElementById('gallery');
    const cardTpl = document.getElementById('cardTpl');
    const searchInput = document.getElementById('search');
    const categoryFilter = document.getElementById('categoryFilter');

    let artworks = [];

    const token = localStorage.getItem('token');

    // Fetch artworks from backend with category filter
    async function fetchArtworks() {
        try {
            // Check for stored category
            const selectedCategory = localStorage.getItem('selectedCategory');
            const categoryParam = selectedCategory ? `?category=${selectedCategory}` : '';
            
            // Update category filter dropdown if category was selected
            if (selectedCategory && categoryFilter) {
                categoryFilter.value = selectedCategory;
                // Clear stored category after applying
                localStorage.removeItem('selectedCategory');
            }

            const res = await fetch(`/api/artworks${categoryParam}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            artworks = await res.json();
            renderArtworks();
        } catch (err) {
            console.error('Failed to fetch artworks:', err);
            gallery.innerHTML = '<p class="no-artworks">Failed to load artworks.</p>';
        }
    }

    // Render artworks based on search & category filter
    function renderArtworks() {
        const search = searchInput.value.toLowerCase();
        const category = categoryFilter.value;

        const filtered = artworks.filter(art => {
            const matchesSearch =
                art.title.toLowerCase().includes(search) ||
                art.artist_name.toLowerCase().includes(search);
            const matchesCategory = category === 'all' || art.category === category;
            return matchesSearch && matchesCategory;
        });

        gallery.innerHTML = '';

        if (filtered.length === 0) {
            gallery.innerHTML = '<p class="no-artworks">No artworks found.</p>';
            return;
        }

        filtered.forEach(art => {
            const card = cardTpl.content.cloneNode(true);

            card.querySelector('.artImg').src = art.image_url;
            card.querySelector('.artImg').alt = art.title;
            card.querySelector('.title').textContent = art.title;
            card.querySelector('.artist').textContent = `By: ${art.artist_name}`;
            card.querySelector('.desc').textContent = art.description;
            card.querySelector('.price').textContent = `$${parseFloat(art.price).toFixed(2)}`;
            card.querySelector('.likes').textContent = art.likes_count || 0;

            const likeBtn = card.querySelector('.likeBtn');
            likeBtn.addEventListener('click', async () => {
                if (!token) {
                    alert('Please login to like artworks.');
                    return;
                }

                try {
                    const res = await fetch(`/api/artworks/${art.id}/like`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (res.ok) {
                        const data = await res.json();
                        card.querySelector('.likes').textContent = data.likes_count;
                    } else {
                        const err = await res.json();
                        alert(err.error || 'Failed to like artwork.');
                    }
                } catch (err) {
                    console.error('Error liking artwork:', err);
                    alert('Network error');
                }
            });

            gallery.appendChild(card);
        });
    }

    // Event listeners for search and filter
    searchInput.addEventListener('input', renderArtworks);
    categoryFilter.addEventListener('change', renderArtworks);

    // Initial fetch
    fetchArtworks();
});
