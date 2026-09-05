// This script handles category selection
document.addEventListener('DOMContentLoaded', () => {
    const categoryCards = document.querySelectorAll('.category-card');

    categoryCards.forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Store category in localStorage
            const category = card.dataset.category;
            localStorage.setItem('selectedCategory', category);
            
            // Redirect to gallery
            window.location.href = 'index.html';
        });
    });
});
