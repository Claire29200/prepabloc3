const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3307,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const bcrypt = require('bcryptjs');

const initDB = async () => {
    let authenticated = false;
    let retries = 10;

    while (!authenticated && retries > 0) {
        try {
            // First, connect without DB to create it
            const connection = await mysql.createConnection({
                host: process.env.DB_HOST,
                port: process.env.DB_PORT || 3307,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
            });

            await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
            await connection.end();
            console.log(`Database ${process.env.DB_NAME} ensured.`);

            // Now initialize tables
            await pool.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    bio TEXT DEFAULT NULL,
                    avatar VARCHAR(255) DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            await pool.query(`
                CREATE TABLE IF NOT EXISTS articles (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    content TEXT NOT NULL,
                    image VARCHAR(255) DEFAULT NULL,
                    user_id INT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
            `);
            
                        await pool.query(`
                CREATE TABLE IF NOT EXISTS comments (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    content TEXT NOT NULL,
                    article_id INT NOT NULL,
                    user_id INT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    INDEX idx_comments_article (article_id, created_at)
                );
            `);

            // SEEDING LOGIC
            const [users] = await pool.query('SELECT * FROM users LIMIT 1');
            if (users.length === 0) {
                console.log('Seeding default user...');
                const hashedPassword = await bcrypt.hash('password123', 10);
                const [userResult] = await pool.query(
                    'INSERT INTO users (username, email, password, bio) VALUES (?, ?, ?, ?)',
                    ['admin', 'admin@blog.com', hashedPassword, 'Administrateur du blog par défaut.']
                );
                const adminId = userResult.insertId;

                console.log('Seeding default articles...');
                await pool.query(
                    'INSERT INTO articles (title, content, user_id) VALUES (?, ?, ?), (?, ?, ?)',
                    [
                        'Bienvenue sur votre nouveau Blog',
                        'Ceci est votre premier article généré automatiquement. Vous pouvez le modifier ou le supprimer depuis votre tableau de bord.',
                        adminId,
                        'Maîtriser Node.js et MySQL',
                        'Node.js et MySQL forment un duo puissant pour la création d\'applications web robustes et scalables...',
                        adminId
                    ]
                );
            }

            console.log('Database and tables initialized successfully.');
            authenticated = true;
        } catch (err) {
            console.log(`Database connection failed, retrying in 3s... (${retries} attempts left)`);
            // Specific check for protocol connection lost or refused
            retries--;
            if (retries === 0) {
                console.error('Max retries reached. Could not connect to database:', err);
            } else {
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
    }
};

module.exports = { pool, initDB };
