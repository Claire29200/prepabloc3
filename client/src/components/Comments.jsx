import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { MessageCircle, Edit, Trash2, Send, User, Check, X } from 'lucide-react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './Comments.css';

const MAX_LENGTH = 5000;
const SERVER_URL = 'http://localhost:5030';

const errorMessage = (err) => err.response?.data?.message || 'Une erreur est survenue.';

// Seconde barrière côté client (défense en profondeur) : le serveur a déjà
// nettoyé le HTML, on le repasse quand même dans DOMPurify avant affichage.
const SafeHtml = ({ html }) => {
    const clean = DOMPurify.sanitize(html, { ADD_ATTR: ['target'] });
    return <div className="comment-content" dangerouslySetInnerHTML={{ __html: clean }} />;
};

const Comments = ({ articleId }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState([]);
    const [content, setContent] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [error, setError] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        let cancelled = false;
        API.get(`/articles/${articleId}/comments`)
            .then(({ data }) => { if (!cancelled) setComments(data); })
            .catch((err) => { if (!cancelled) setError(errorMessage(err)); });
        return () => { cancelled = true; };
    }, [articleId]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;
        setSending(true);
        setError('');
        try {
            const { data } = await API.post(`/articles/${articleId}/comments`, { content });
            setComments((prev) => [...prev, data]);
            setContent('');
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setSending(false);
        }
    };

    const handleUpdate = async (id) => {
        setError('');
        try {
            const { data } = await API.put(`/comments/${id}`, { content: editContent });
            setComments((prev) => prev.map((c) => (c.id === id ? data : c)));
            setEditingId(null);
        } catch (err) {
            setError(errorMessage(err));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Voulez-vous vraiment supprimer ce commentaire ?')) return;
        setError('');
        try {
            await API.delete(`/comments/${id}`);
            setComments((prev) => prev.filter((c) => c.id !== id));
        } catch (err) {
            setError(errorMessage(err));
        }
    };

    // Confort d'interface uniquement : la vraie vérification est faite par le serveur
    const isOwner = (c) => user && Number(user.id) === Number(c.user_id);

    return (
        <section className="comments glass" aria-labelledby="comments-title">
            <h2 id="comments-title" className="comments-title">
                <MessageCircle size={22} /> Commentaires ({comments.length})
            </h2>

            {error && <p className="comments-error" role="alert">{error}</p>}

            {comments.length === 0 && <p className="comments-empty">Aucun commentaire pour le moment.</p>}

            <ul className="comment-list">
                {comments.map((c) => (
                    <li key={c.id} className="comment">
                        <div className="comment-header">
                            <div className="comment-author">
                                {c.avatar
                                    ? <img src={`${SERVER_URL}${c.avatar}`} alt={c.username} className="comment-avatar" />
                                    : <User size={20} />}
                                {/* JSX échappe automatiquement le nom d'utilisateur */}
                                <Link to={`/profile/${c.user_id}`} className="comment-username">{c.username}</Link>
                                <time dateTime={c.created_at} className="comment-date">
                                    {new Date(c.created_at).toLocaleString('fr-FR')}
                                </time>
                            </div>

                            {isOwner(c) && editingId !== c.id && (
                                <div className="comment-actions">
                                    <button
                                        type="button"
                                        className="btn glass comment-btn"
                                        onClick={() => { setEditingId(c.id); setEditContent(c.content); }}
                                    >
                                        <Edit size={14} /> Modifier
                                    </button>
                                    <button
                                        type="button"
                                        className="btn comment-btn comment-btn-danger"
                                        onClick={() => handleDelete(c.id)}
                                    >
                                        <Trash2 size={14} /> Supprimer
                                    </button>
                                </div>
                            )}
                        </div>

                        {editingId === c.id ? (
                            <div className="comment-edit">
                                <label htmlFor={`edit-${c.id}`} className="sr-only">Modifier le commentaire</label>
                                <textarea
                                    id={`edit-${c.id}`}
                                    value={editContent}
                                    maxLength={MAX_LENGTH}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    rows={4}
                                />
                                <div className="comment-actions">
                                    <button type="button" className="btn comment-btn" onClick={() => handleUpdate(c.id)}>
                                        <Check size={14} /> Enregistrer
                                    </button>
                                    <button type="button" className="btn glass comment-btn" onClick={() => setEditingId(null)}>
                                        <X size={14} /> Annuler
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <SafeHtml html={c.content_html} />
                        )}
                    </li>
                ))}
            </ul>

            {user ? (
                <form onSubmit={handleCreate} className="comment-form">
                    <label htmlFor="new-comment">Votre commentaire (texte, Markdown ou HTML)</label>
                    <textarea
                        id="new-comment"
                        value={content}
                        maxLength={MAX_LENGTH}
                        onChange={(e) => setContent(e.target.value)}
                        rows={4}
                        placeholder="Écrivez votre commentaire…"
                        required
                    />
                    <div className="comment-form-footer">
                        <small>{content.length} / {MAX_LENGTH}</small>
                        <button type="submit" className="btn" disabled={sending || !content.trim()}>
                            <Send size={16} /> {sending ? 'Envoi…' : 'Publier'}
                        </button>
                    </div>
                </form>
            ) : (
                <p className="comments-empty">
                    <Link to="/login">Connectez-vous</Link> pour laisser un commentaire.
                </p>
            )}
        </section>
    );
};

export default Comments;