// =====================================================================
// server/controllers/comment.controller.js
// Contrôleur des commentaires (Express 5 + mysql2/promise, sans ORM)
// =====================================================================
const sanitizeHtml = require('sanitize-html');
const { marked } = require('marked');
const { pool } = require('../config/db');

const MAX_LENGTH = 5000;

// ---------------------------------------------------------------------
// 1. Politique de nettoyage : LISTE BLANCHE.
//    Tout ce qui n'est pas explicitement autorisé est supprimé :
//    pas de <script>, <iframe>, <img>, <style>, ni d'attributs on* / style.
// ---------------------------------------------------------------------
const SANITIZE_OPTIONS = {
    allowedTags: [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'del',
        'blockquote', 'code', 'pre', 'ul', 'ol', 'li', 'a', 'h3', 'h4', 'hr',
    ],
    allowedAttributes: { a: ['href', 'title', 'rel', 'target'] },
    allowedSchemes: ['http', 'https', 'mailto'], // bloque javascript: et data:
    allowProtocolRelative: false,
    transformTags: {
        // Liens sortants : pas d'accès à window.opener (tabnabbing), pas de SEO spam
        a: sanitizeHtml.simpleTransform('a', {
            rel: 'noopener noreferrer nofollow',
            target: '_blank',
        }),
    },
};

// Accepte les 3 formats du CDC : texte brut, Markdown et HTML.
// Markdown -> HTML (marked), puis nettoyage du HTML obtenu (sanitize-html).
const renderSafeHtml = (raw) => {
    const html = marked.parse(raw, { gfm: true, breaks: true });
    return sanitizeHtml(html, SANITIZE_OPTIONS);
};

// ---------------------------------------------------------------------
// 2. Validation des entrées
// ---------------------------------------------------------------------
const parseId = (value) => {
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : null; // refuse "1 OR 1=1", "-1", "abc"
};

const validateContent = (content) => {
    if (typeof content !== 'string') return 'Le contenu doit être une chaîne de caractères.';
    const trimmed = content.trim();
    if (trimmed.length === 0) return 'Le commentaire ne peut pas être vide.';
    if (trimmed.length > MAX_LENGTH) return `Le commentaire dépasse ${MAX_LENGTH} caractères.`;
    return null;
};

// Données renvoyées : jamais l'email ni le hash du mot de passe
const toDto = (row) => ({
    id: row.id,
    content: row.content,                      // source brute (pour l'édition)
    content_html: renderSafeHtml(row.content), // rendu sûr, identique web et mobile
    article_id: row.article_id,
    user_id: row.user_id,
    username: row.username,
    avatar: row.avatar,
    created_at: row.created_at,
});

const SELECT_COMMENT = `
    SELECT comments.id, comments.content, comments.article_id, comments.user_id,
           comments.created_at, users.username, users.avatar
    FROM comments
    JOIN users ON comments.user_id = users.id`;

// Erreur générique : détail journalisé côté serveur, rien divulgué au client
const serverError = (res, err) => {
    console.error('[comments]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
};

// Contrôle de propriété (anti-IDOR) : seul l'auteur modifie / supprime
const loadOwnedComment = async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        res.status(400).json({ message: 'Identifiant invalide.' });
        return null;
    }
    const [rows] = await pool.execute('SELECT id, user_id FROM comments WHERE id = ?', [id]);
    if (rows.length === 0) {
        res.status(404).json({ message: 'Commentaire introuvable.' });
        return null;
    }
    if (Number(rows[0].user_id) !== Number(req.userId)) {
        res.status(403).json({ message: 'Action non autorisée.' });
        return null;
    }
    return id;
};

// ---------------------------------------------------------------------
// 3. Actions
// ---------------------------------------------------------------------

// GET /api/articles/:articleId/comments (public)
exports.getCommentsByArticle = async (req, res) => {
    const articleId = parseId(req.params.articleId);
    if (!articleId) return res.status(400).json({ message: 'Identifiant invalide.' });

    try {
        const [rows] = await pool.execute(
            `${SELECT_COMMENT} WHERE comments.article_id = ? ORDER BY comments.created_at ASC, comments.id ASC`,
            [articleId], // requête préparée : la valeur n'est jamais interprétée comme du SQL
        );
        return res.json(rows.map(toDto));
    } catch (err) {
        return serverError(res, err);
    }
};

// POST /api/articles/:articleId/comments (connecté)
exports.createComment = async (req, res) => {
    const articleId = parseId(req.params.articleId);
    if (!articleId) return res.status(400).json({ message: 'Identifiant invalide.' });

    const error = validateContent(req.body?.content);
    if (error) return res.status(400).json({ message: error });

    try {
        const [articles] = await pool.execute('SELECT id FROM articles WHERE id = ?', [articleId]);
        if (articles.length === 0) return res.status(404).json({ message: 'Article introuvable.' });

        // user_id vient du token vérifié (req.userId), JAMAIS du corps de la requête
        const [result] = await pool.execute(
            'INSERT INTO comments (content, article_id, user_id) VALUES (?, ?, ?)',
            [req.body.content.trim(), articleId, req.userId],
        );

        const [rows] = await pool.execute(`${SELECT_COMMENT} WHERE comments.id = ?`, [result.insertId]);
        return res.status(201).json(toDto(rows[0]));
    } catch (err) {
        return serverError(res, err);
    }
};

// PUT /api/comments/:id (auteur uniquement)
exports.updateComment = async (req, res) => {
    const error = validateContent(req.body?.content);
    if (error) return res.status(400).json({ message: error });

    try {
        const id = await loadOwnedComment(req, res);
        if (!id) return undefined;

        // Double verrou : la condition user_id est aussi dans la requête SQL
        await pool.execute(
            'UPDATE comments SET content = ? WHERE id = ? AND user_id = ?',
            [req.body.content.trim(), id, req.userId],
        );

        const [rows] = await pool.execute(`${SELECT_COMMENT} WHERE comments.id = ?`, [id]);
        return res.json(toDto(rows[0]));
    } catch (err) {
        return serverError(res, err);
    }
};

// DELETE /api/comments/:id (auteur uniquement)
exports.deleteComment = async (req, res) => {
    try {
        const id = await loadOwnedComment(req, res);
        if (!id) return undefined;

        await pool.execute('DELETE FROM comments WHERE id = ? AND user_id = ?', [id, req.userId]);
        return res.status(204).end();
    } catch (err) {
        return serverError(res, err);
    }
};

exports.renderSafeHtml = renderSafeHtml; // exporté pour les tests unitaires