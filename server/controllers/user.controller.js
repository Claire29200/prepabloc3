const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getProfile = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, username, email, bio, avatar, created_at FROM users WHERE id = ?',
            [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        if (parseInt(req.params.id) !== req.userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { username, bio, password } = req.body;
        let query = 'UPDATE users SET username = ?, bio = ?';
        let params = [username, bio];

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += ', password = ?';
            params.push(hashedPassword);
        }

        if (req.file) {
            const avatar = `/uploads/${req.file.filename}`;
            query += ', avatar = ?';
            params.push(avatar);
        }

        query += ' WHERE id = ?';
        params.push(req.userId);

        await pool.query(query, params);
        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
