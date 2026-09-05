document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Show loading state
    document.getElementById('profileDetails').innerHTML = '<p>Loading profile...</p>';
    document.getElementById('userGallery').innerHTML = '<p>Loading artworks...</p>';

    try {
        // Fetch user profile and artworks
        const [profileResponse, artworksResponse] = await Promise.all([
            fetch('/api/users/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch('/api/users/my-artworks', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);

        if (!profileResponse.ok) throw new Error('Failed to fetch profile');
        if (!artworksResponse.ok) throw new Error('Failed to fetch artworks');

        const profileData = await profileResponse.json();
        const artworks = await artworksResponse.json();

        // Update profile details with database fields
        document.getElementById('profileImage').src = profileData.profilePic ? profileData.profilePic : 'images/default-avatar.png';
        document.getElementById('profileDetails').innerHTML = `
            <h3>${profileData.username}</h3>
            <p>Email: ${profileData.email}</p>
            <p>Role: ${profileData.role}</p>
            <p>Member since: ${new Date(profileData.created_at).toLocaleDateString()}</p>
        `;

        // Display user's artworks with correct field names
        const userGallery = document.getElementById('userGallery');
        if (!artworks || artworks.length === 0) {
            userGallery.innerHTML = '<p class="no-artworks">No artworks uploaded yet.</p>';
            return;
        }

        userGallery.innerHTML = artworks.map(artwork => `
            <article class="card">
                <img src="${artwork.image_url}" alt="${artwork.title}" class="artwork-image">
                <div class="meta">
                    <h3>${artwork.title}</h3>
                    <p>${artwork.description || 'No description'}</p>
                    <p>Category: ${artwork.category}</p>
                    <p>Price: $${artwork.price || '0.00'}</p>
                    <div class="artwork-actions">
                        <button onclick="openEditModal(${JSON.stringify(artwork)})" class="btn">Edit</button>
                        <button onclick="deleteArtwork(${artwork.id})" class="btn btn-danger">Delete</button>
                    </div>
                </div>
            </article>
        `).join('');

    } catch (error) {
        console.error('Error loading profile data:', error);
        document.getElementById('profileDetails').innerHTML = '<p class="error">Failed to load profile data</p>';
        document.getElementById('userGallery').innerHTML = '<p class="error">Failed to load artworks</p>';
    }

    // Handle profile pic upload
    document.getElementById('profilePicInput').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Show preview immediately
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('profileImage').src = e.target.result;
        };
        reader.readAsDataURL(file);

        const formData = new FormData();
        formData.append('profilePic', file);

        try {
            const response = await fetch('/api/users/profile/picture', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            // Update with server URL and force refresh
            document.getElementById('profileImage').src = `${data.profilePic}?t=${Date.now()}`;
            alert('Profile picture updated successfully');
        } catch (error) {
            console.error('Error uploading profile pic:', error);
            alert('Failed to upload profile picture');
            // Revert to original image on error
            document.getElementById('profileImage').src = profileData.profilePic || 'images/default-avatar.png';
        }
    });

    // Handle remove profile pic
    document.getElementById('removePicBtn').addEventListener('click', async () => {
        if (!confirm('Are you sure you want to remove your profile picture?')) return;

        const currentImage = document.getElementById('profileImage').src;

        try {
            const response = await fetch('/api/users/profile/picture', {
                method: 'DELETE',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (!response.ok) {
                throw new Error('Remove failed');
            }

            document.getElementById('profileImage').src = 'images/default-avatar.png';
            // Reset file input
            document.getElementById('profilePicInput').value = '';
            alert('Profile picture removed successfully');
        } catch (error) {
            console.error('Error removing profile pic:', error);
            alert('Failed to remove profile picture');
            // Revert on error
            document.getElementById('profileImage').src = currentImage;
        }
    });
});

// Artwork management functions
async function deleteArtwork(artworkId) {
    if (!confirm('Are you sure you want to delete this artwork?')) return;
    
    try {
        const response = await fetch(`/api/artworks/${artworkId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            window.location.reload();
        } else {
            alert('Failed to delete artwork');
        }
    } catch (error) {
        console.error('Error deleting artwork:', error);
        alert('Network error occurred');
    }
}

function openEditModal(artwork) {
    const modal = document.getElementById('editArtworkModal');
    const form = document.getElementById('editArtworkForm');
    
    form.elements.artworkId.value = artwork.id;
    form.elements.title.value = artwork.title;
    form.elements.description.value = artwork.description;
    form.elements.category.value = artwork.category;
    form.elements.price.value = artwork.price;
    
    modal.style.display = 'block';
}

// Handle edit form submission
document.getElementById('editArtworkForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const artworkId = form.elements.artworkId.value;
    
    const formData = new FormData(form);
    
    try {
        const response = await fetch(`/api/artworks/${artworkId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(Object.fromEntries(formData))
        });

        if (response.ok) {
            document.getElementById('editArtworkModal').style.display = 'none';
            window.location.reload();
        } else {
            throw new Error('Failed to update artwork');
        }
    } catch (error) {
        console.error('Error updating artwork:', error);
        alert('Failed to update artwork');
    }
});

// Close modal when clicking the close button or outside
document.querySelector('#editArtworkModal .close').onclick = () => {
    document.getElementById('editArtworkModal').style.display = 'none';
};

window.onclick = (event) => {
    const modal = document.getElementById('editArtworkModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};
