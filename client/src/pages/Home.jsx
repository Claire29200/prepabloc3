import { useState, useEffect } from 'react';
import API from '../api/axios';
import ArticleCard from '../components/ArticleCard';

const Home = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                const { data } = await API.get('/articles');
                setArticles(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchArticles();
    }, []);

    if (loading) return <div>Chargement...</div>;

    return (
        <div>
            <header style={{ padding: '40px 0', textAlign: 'center' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '10px' }}>Actualités & Insights</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Découvrez les derniers articles de notre communauté</p>
            </header>

            {articles.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Aucun article pour le moment.</p>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '30px'
                }}>
                    {articles.map(article => (
                        <ArticleCard key={article.id} article={article} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Home;
