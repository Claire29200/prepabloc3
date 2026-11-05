const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const verifyToken = require('../middleware/auth');

// Anti-spam : 30 écritures maximum par IP toutes les 15 minutes
const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Trop de requêtes, réessayez plus tard.' },
});

// Lecture publique (comme les articles)
router.get('/articles/:articleId/comments', commentController.getCommentsByArticle);

// Écriture : utilisateur connecté (verifyToken remplit req.userId)
router.post('/articles/:articleId/comments', verifyToken, writeLimiter, commentController.createComment);

// Modification / suppression : connecté + auteur (contrôlé dans le controller)
router.put('/comments/:id', verifyToken, writeLimiter, commentController.updateComment);
router.delete('/comments/:id', verifyToken, writeLimiter, commentController.deleteComment);

module.exports = router;