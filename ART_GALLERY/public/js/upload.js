document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const price = parseFloat(formData.get('price'));
    
    // Validate price
    if (price < 1.00) {
        alert('Price must be at least $1.00');
        return;
    }

    const token = localStorage.getItem('token');
    
    if (!token) {
        alert('Please login first');
        window.location.href = '/login.html';
        return;
    }

    try {
        const response = await fetch('/api/artworks', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();
        
        if (response.ok) {
            alert('Artwork uploaded successfully!');
            window.location.href = '/index.html';
        } else {
            alert(data.message || 'Upload failed');
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('Network error occurred');
    }
});
