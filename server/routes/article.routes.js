const express = require('express');
const router = express.Router();
const articleController = require('../controllers/article.controller');
const verifyToken = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', articleController.getAllArticles);
router.get('/:id', articleController.getArticleById);
router.post('/', verifyToken, upload.single('image'), articleController.createArticle);
router.put('/:id', verifyToken, upload.single('image'), articleController.updateArticle);
router.delete('/:id', verifyToken, articleController.deleteArticle);

module.exports = router;
