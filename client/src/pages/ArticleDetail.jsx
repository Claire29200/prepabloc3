import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Edit, Trash2, Calendar, User } from 'lucide-react';

const ArticleDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const { data } = await API.get(`/articles/${id}`);
                setArticle(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchArticle();
    }, [id]);

    const handleDelete = async () => {
        if (window.confirm('Voulez-vous vraiment supprimer cet article ?')) {
            try {
                await API.delete(`/articles/${id}`);
                navigate('/');
            } catch (err) {
                console.error(err);
            }
        }
    };

    if (loading) return <div>Chargement...</div>;
    if (!article) return <div>Article introuvable.</div>;

    const isOwner = user && user.id === article.user_id;

    return (
        <div style={{ maxWidth: '800px', margin: '40px auto' }}>
            <article>
                {article.image && (
                    <img
                        src={`http://localhost:5000${article.image}`}
                        alt={article.title}
                        style={{ width: '100%', height: '400px', objectFit: 'cover', borderRadius: '16px', marginBottom: '30px' }}
                    />
                )}

                <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>{article.title}</h1>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', padding: '20px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {article.avatar ? (
                            <img src={`http://localhost:5000${article.avatar}`} alt={article.username} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                        ) : <User />}
                        <div>
                            <Link to={`/profile/${article.user_id}`} style={{ fontWeight: 'bold' }}>{article.username}</Link>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Calendar size={14} /> {new Date(article.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    {isOwner && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Link to={`/edit/${id}`} className="btn glass" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Edit size={16} /> Modifier
                            </Link>
                            <button onClick={handleDelete} className="btn" style={{ padding: '8px 12px', background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Trash2 size={16} /> Supprimer
                            </button>
                        </div>
                    )}
                </div>

                <div style={{ fontSize: '1.2rem', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
                    {article.content}
                </div>
            </article>
        </div>
    );
};

export default ArticleDetail;
