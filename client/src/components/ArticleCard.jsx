import { Link } from 'react-router-dom';

const ArticleCard = ({ article }) => {
    return (
        <div className="glass" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {article.image && (
                <img
                    src={`http://localhost:5000${article.image}`}
                    alt={article.title}
                    style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                />
            )}
            <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ marginBottom: '10px', fontSize: '1.25rem' }}>{article.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px', flex: 1 }}>
                    {article.content.substring(0, 100)}...
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                        {article.avatar && (
                            <img
                                src={`http://localhost:5000${article.avatar}`}
                                alt={article.username}
                                style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                            />
                        )}
                        <span>{article.username}</span>
                    </div>
                    <Link to={`/article/${article.id}`} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                        Lire la suite
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ArticleCard;
