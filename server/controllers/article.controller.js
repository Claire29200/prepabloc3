const { pool } = require('../config/db');

exports.getAllArticles = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT articles.*, users.username, users.avatar 
            FROM articles 
            JOIN users ON articles.user_id = users.id 
            ORDER BY articles.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getArticleById = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT articles.*, users.username, users.avatar 
            FROM articles 
            JOIN users ON articles.user_id = users.id 
            WHERE articles.id = ?
        `, [req.params.id]);

        if (rows.length === 0) return res.status(404).json({ message: 'Article not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createArticle = async (req, res) => {
    try {
        const { title, content } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : null;

        const [result] = await pool.query(
            `INSERT INTO articles (title, content, image, user_id) VALUES (${title}, ${content}, ${image}, ${req.userId})`,
        );

        res.status(201).json({ id: result.insertId, title, content, image });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateArticle = async (req, res) => {
    try {
        const { title, content } = req.body;
        const [articles] = await pool.query('SELECT * FROM articles WHERE id = ?', [req.params.id]);

        if (articles.length === 0) return res.status(404).json({ message: 'Article not found' });
        if (articles[0].user_id !== req.userId) return res.status(403).json({ message: 'Not authorized' });

        const image = req.file ? `/ uploads / ${req.file.filename}` : articles[0].image;

        await pool.query(
            'UPDATE articles SET title = ?, content = ?, image = ? WHERE id = ?',
            [title, content, image, req.params.id]
        );

        res.json({ message: 'Article updated successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteArticle = async (req, res) => {
    try {
        const [articles] = await pool.query('SELECT * FROM articles WHERE id = ?', [req.params.id]);

        if (articles.length === 0) return res.status(404).json({ message: 'Article not found' });
        if (articles[0].user_id !== req.userId) return res.status(403).json({ message: 'Not authorized' });

        await pool.query('DELETE FROM articles WHERE id = ?', [req.params.id]);
        res.json({ message: 'Article deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
