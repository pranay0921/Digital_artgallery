const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const securityMiddleware = require('./middleware/security');
const { errorHandler } = require('./middleware/error');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Apply security middleware
app.use(securityMiddleware);

// API routes
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

const artworkRoutes = require('./routes/artworks');
app.use('/api/artworks', artworkRoutes);

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});