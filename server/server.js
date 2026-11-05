require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { initDB } = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const articleRoutes = require('./routes/article.routes');
const userRoutes = require('./routes/user.routes');
const commentRoutes = require('./routes/comment.routes');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Sécurité des en-têtes HTTP : X-Content-Type-Options: nosniff,
// X-Frame-Options / frame-ancestors (clickjacking), HSTS, suppression de X-Powered-By...
// cross-origin autorisé pour que le front (port 5173) puisse afficher les images /uploads
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS restreint au front (avant : cors() ouvert à toutes les origines)
app.use(cors({ origin: CLIENT_URL }));

// Limite la taille des corps JSON (protection contre les requêtes géantes)
app.use(express.json({ limit: '20kb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// DB initialization
(async () => {
    await initDB();
})();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/users', userRoutes);
app.use('/api', commentRoutes);

// Basic route
app.get('/', (req, res) => {
    res.send('Blog API is running...');
});

// Gestionnaire d'erreurs global : pas de stack trace envoyée au client
app.use((err, req, res, next) => {
    console.error('[server]', err.message);
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ message: status === 500 ? 'Erreur serveur.' : err.message });
});

// Le serveur n'écoute que s'il est lancé directement (node server.js),
// pas quand il est importé par les tests
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;