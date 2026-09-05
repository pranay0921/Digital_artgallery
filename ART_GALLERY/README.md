# Digital Art Gallery

A full-stack web application for showcasing, buying, and managing digital artworks. Features include user registration, profile management, artwork upload, purchase flow, admin panel, and secure backend.

## API Routes

### Authentication Routes (`/api/auth`)

- `POST /api/auth/register`
  - Register a new user
  - Body: `{ username, email, password }`
  - Returns: User object with JWT token

- `POST /api/auth/login`
  - Login existing user
  - Body: `{ email, password }`
  - Returns: JWT token and user info

### User Routes (`/api/users`)

- `GET /api/users/profile`
  - Get current user profile
  - Auth required: Yes
  - Returns: User profile data

- `PUT /api/users/profile`
  - Update user profile
  - Auth required: Yes
  - Body: `{ username, email, profile_pic }`
  - Returns: Updated user data

### Artwork Routes (`/api/artworks`)

- `GET /api/artworks`
  - Get all artworks
  - Query params: `category`, `artist_id`
  - Returns: Array of artworks

- `GET /api/artworks/:id`
  - Get single artwork
  - Returns: Artwork details

- `POST /api/artworks`
  - Upload new artwork
  - Auth required: Yes
  - Body: Multipart form data
    - `title`: Artwork title
    - `description`: Artwork description
    - `category`: Category (Painting/3D/Anime)
    - `price`: Price (optional)
    - `image`: Artwork file
  - Returns: Created artwork object

- `PUT /api/artworks/:id`
  - Update artwork details
  - Auth required: Yes (must be artist)
  - Body: Same as POST
  - Returns: Updated artwork

- `DELETE /api/artworks/:id`
  - Delete artwork
  - Auth required: Yes (must be artist or admin)

### Admin Routes (`/api/admin`)

- `GET /api/admin/stats`
  - Get dashboard statistics
  - Auth required: Yes (admin only)
  - Returns: Statistics object

- `GET /api/admin/users`
  - Get all users
  - Auth required: Yes (admin only)
  - Query params: `status` (active/banned)
  - Returns: Array of users

- `PUT /api/admin/users/:id`
  - Update user status
  - Auth required: Yes (admin only)
  - Body: `{ is_active: boolean }`
  - Returns: Updated user

- `GET /api/admin/artworks`
  - Get all artworks for moderation
  - Auth required: Yes (admin only)
  - Query params: `status` (all/reported)
  - Returns: Array of artworks

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'artist', 'admin') DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    profile_pic VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Artworks Table
```sql
CREATE TABLE artworks (
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
```

### Comments Table
```sql
CREATE TABLE comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    artwork_id INT,
    user_id INT,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)
```

### Likes Table
```sql
CREATE TABLE likes (
    artwork_id INT,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (artwork_id, user_id),
    FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)
```

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure database in `config/database.js`
4. Initialize database:
   ```bash
   node config/initDb.js
   ```
5. Start the server:
   ```bamsh
   npm start
   ```
   Server will run on http://localhost:3000

## Folder Structure

- `public/` - Frontend files (HTML, CSS, JS)
- `routes/` - Express route handlers
- `middleware/` - Security and error handling middleware
- `config/` - Database and environment configuration
- `uploads/` - Uploaded images (created automatically)
- `README.md` - Project documentation

## Security

- JWT authentication for all protected routes
- Admin-only access for admin panel and endpoints
- Rate limiting and security headers
- Input validation and error handling

## Admin Panel

- Accessible to users with `admin` role
- Manage users, artworks, and categories (CRUD)

## License

MIT License

---

**Note:** For production, use strong secrets, HTTPS, and review all security settings.
