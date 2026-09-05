document.addEventListener('DOMContentLoaded', async () => {
    // Check admin authorization
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        // Test admin access
        const response = await fetch('/api/admin/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Admin access denied');
        }

        // Initialize dashboard
        loadDashboardStats();
        loadUsers();
    } catch (error) {
        console.error('Admin access error:', error);
        localStorage.removeItem('token');
        window.location.href = 'login.html';
        return;
    }

    // Setup navigation
    document.querySelectorAll('.admin-menu li').forEach(item => {
        item.addEventListener('click', () => {
            if (item.id === 'logoutBtn') {
                localStorage.removeItem('token');
                window.location.href = 'login.html';
                return;
            }

            setActivePage(item.dataset.page);
            loadPageContent(item.dataset.page);
        });
    });
});

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const response = await fetch('/api/admin/stats', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const stats = await response.json();

        document.getElementById('activeUsers').textContent = stats.activeUsers || 0;
        document.getElementById('bannedUsers').textContent = stats.bannedUsers || 0;
        document.getElementById('totalArtworks').textContent = stats.artworks || 0;
        document.getElementById('reportedContent').textContent = stats.reportedContent || 0;
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

// Load page content based on selection
function loadPageContent(page) {
    switch (page) {
        case 'users': loadUsers(); break;
        case 'artworks': loadArtworks(); break;
        case 'categories': loadCategories(); break;
        default: loadDashboardStats();
    }
}

// Set active page in UI
function setActivePage(page) {
    document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.admin-menu li').forEach(item => item.classList.remove('active'));
    
    document.getElementById(`${page}Page`).classList.add('active');
    document.querySelector(`[data-page="${page}"]`).classList.add('active');
}

// CRUD Operations for Users
async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    const status = document.getElementById('userStatusFilter').value;
    
    try {
        const response = await fetch(`/api/admin/users?status=${status}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const users = await response.json();
        
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.is_active ? 'Active' : 'Banned'}</td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                    <button onclick="toggleUserStatus(${user.id}, ${!user.is_active})" 
                            class="btn ${user.is_active ? 'btn-warning' : 'btn-success'}">
                        ${user.is_active ? 'Ban User' : 'Unban User'}
                    </button>
                    <button onclick="deleteUser(${user.id})" class="btn btn-danger">
                        Delete Account
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showError('Failed to load users');
    }
}

// CRUD Operations for Artworks
async function loadArtworks() {
    const tbody = document.getElementById('artworksTableBody');
    const status = document.getElementById('artworkStatusFilter').value;
    
    try {
        const response = await fetch(`/api/admin/artworks?status=${status}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const artworks = await response.json();
        
        tbody.innerHTML = artworks.map(art => `
            <tr>
                <td>${art.title}</td>
                <td>${art.artist_name}</td>
                <td>${art.category}</td>
                <td>${art.reports_count || 0}</td>
                <td>
                    <button onclick="deleteArtwork(${art.id})" class="btn btn-danger">
                        Remove Artwork
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showError('Failed to load artworks');
    }
}

// CRUD Operations for Categories
async function loadCategories() {
    try {
        const response = await fetch('/api/admin/categories', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const categories = await response.json();

        document.getElementById('categoriesTableBody').innerHTML = categories.map(cat => `
            <tr>
                <td>${cat.name}</td>
                <td>${cat.artwork_count || 0}</td>
                <td>
                    <button onclick="editCategory(${cat.id})" class="btn-edit">Edit</button>
                    <button onclick="deleteCategory(${cat.id})" class="btn-delete">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Failed to load categories:', error);
    }
}

// Error handler utility
function showError(message, type = 'error') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    document.querySelector('.admin-content').prepend(alert);
    setTimeout(() => alert.remove(), 5000);
}

// Loading state utility
function setLoading(elementId, isLoading) {
    const element = document.getElementById(elementId);
    if (isLoading) {
        element.classList.add('loading');
        element.innerHTML = '<div class="loader"></div>';
    } else {
        element.classList.remove('loading');
    }
}

async function loadTabContent(tab) {
    setLoading(`${tab}TableBody`, true);
    
    try {
        const response = await fetch(`/api/admin/${tab}`, {
            headers: { 
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to load ${tab}: ${response.statusText}`);
        }

        const data = await response.json();
        renderTabContent(tab, data);
        showError(`${tab} loaded successfully`, 'success');
    } catch (error) {
        console.error(`Error loading ${tab}:`, error);
        showError(`Failed to load ${tab}: ${error.message}`);
    } finally {
        setLoading(`${tab}TableBody`, false);
    }
}

// CRUD operations with error handling
async function deleteItem(type, id) {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    try {
        const response = await fetch(`/api/admin/${type}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `Failed to delete ${type}`);
        }

        showError(`${type} deleted successfully`, 'success');
        loadTabContent(type);
    } catch (error) {
        console.error(`Error deleting ${type}:`, error);
        showError(error.message);
    }
}

// Delete operations
async function deleteUser(id) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
        const response = await fetch(`/api/admin/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
            loadUsers();
        } else {
            alert('Failed to delete user');
        }
    } catch (error) {
        console.error('Delete error:', error);
    }
}

// Similar delete functions for artworks and categories...

// Modal operations
function openAddUserModal() {
    // Implement user add/edit modal
}

function openAddArtworkModal() {
    // Implement artwork add/edit modal
}

function openAddCategoryModal() {
    // Implement category add/edit modal
}

// Session expiry handler
function checkAuthStatus(response) {
    if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Error boundary for the entire dashboard
window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled promise rejection:', event.reason);
    showError('An unexpected error occurred. Please try again.');
});
