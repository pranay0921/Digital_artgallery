const db = require('./database');
const fs = require('fs');
const path = require('path');

const cleanupUploads = (directory) => {
    const files = fs.readdirSync(directory);
    const seen = new Set();
    
    files.forEach(file => {
        const filePath = path.join(directory, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isFile()) {
            // Check for duplicate based on content hash or name pattern
            const fileBase = file.split('-')[1]; // Get original filename part
            if (seen.has(fileBase)) {
                fs.unlinkSync(filePath); // Remove duplicate
            } else {
                seen.add(fileBase);
            }
        }
    });
};

const initDatabase = async () => {
    try {
        // Create tables if they don't exist
        await db.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('user', 'artist', 'admin') DEFAULT 'user',
                is_active BOOLEAN DEFAULT true,
                profile_pic VARCHAR(255) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS artworks (
                id INT PRIMARY KEY AUTO_INCREMENT,
                title VARCHAR(100) NOT NULL,
                description TEXT,
                image_url VARCHAR(255) NOT NULL,
                category ENUM('Painting', '3D', 'Anime') NOT NULL,
                artist_id INT,
                price DECIMAL(10,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (artist_id) REFERENCES users(id)
            )
        `);
        await db.execute(`
        CREATE TABLE IF NOT EXISTS comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    artwork_id INT,
    user_id INT,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

await db.execute(`
CREATE TABLE IF NOT EXISTS likes (
    artwork_id INT,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (artwork_id, user_id),
    FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);



        console.log('Database tables initialized successfully');

        // Single uploads directory creation and cleanup
        const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)){
            fs.mkdirSync(uploadsDir, { recursive: true });
            console.log('Uploads directory created');
        } else {
            cleanupUploads(uploadsDir);
            console.log('Uploads directory cleaned');
        }

    } catch (error) {
        console.error('Database initialization error:', error);
        process.exit(1);
    }
};

module.exports = initDatabase;
