document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('checkoutModal');
    const closeBtn = document.querySelector('.close');
    let currentArtwork = null;

    // Setup buy buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('buyBtn')) {
            const card = e.target.closest('.card');
            currentArtwork = {
                image: card.querySelector('.artImg').src,
                title: card.querySelector('.title').textContent,
                price: card.querySelector('.price').textContent
            };
            modal.style.display = 'block';
            document.getElementById('totalAmount').textContent = currentArtwork.price;
        }
    });

    // Close modal
    closeBtn.onclick = () => {
        modal.style.display = 'none';
        resetCheckout();
    };

    // Handle buyer form submission
    document.getElementById('buyerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        document.getElementById('buyerInfoSection').style.display = 'none';
        document.getElementById('paymentSection').style.display = 'block';
    });

    // Handle payment
    document.getElementById('payNowButton').addEventListener('click', () => {
        document.getElementById('paymentSection').style.display = 'none';
        document.getElementById('successSection').style.display = 'block';
    });

    // Handle download
    document.getElementById('downloadButton').addEventListener('click', () => {
        if (currentArtwork) {
            const link = document.createElement('a');
            link.href = currentArtwork.image;
            link.download = `${currentArtwork.title}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    });

    function resetCheckout() {
        document.getElementById('buyerInfoSection').style.display = 'block';
        document.getElementById('paymentSection').style.display = 'none';
        document.getElementById('successSection').style.display = 'none';
        document.getElementById('buyerForm').reset();
        currentArtwork = null;
    }
});
