const mysql = require('mysql2');

const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: 'root',
  database: 'ARTGALLERY',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Add this query to your initDb.js or run it manually:
// ALTER TABLE users ADD COLUMN profile_pic VARCHAR(255) DEFAULT NULL;

module.exports = pool.promise();
