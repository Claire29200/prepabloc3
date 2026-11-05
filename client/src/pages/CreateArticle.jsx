import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { Image as ImageIcon, Send } from 'lucide-react';

const CreateArticle = () => {
    const [formData, setFormData] = useState({ title: '', content: '' });
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        data.append('title', formData.title);
        data.append('content', formData.content);
        if (image) data.append('image', image);

        try {
            const response = await API.post('/articles', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            navigate(`/article/${response.data.id}`);
        } catch (err) {
            console.error(err);
            alert('Erreur lors de la création de l\'article');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '40px auto' }}>
            <h2 style={{ marginBottom: '30px' }}>Publier un nouvel article</h2>
            <div className="glass" style={{ padding: '30px' }}>
                <form onSubmit={handleSubmit}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Titre</label>
                    <input
                        type="text"
                        placeholder="Titre de l'article"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                    />

                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Contenu (Markdown supporté)</label>
                    <textarea
                        placeholder="Écrivez votre article ici..."
                        rows="12"
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        required
                        style={{ fontFamily: 'inherit' }}
                    />

                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Image de couverture</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                        <label className="btn glass" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ImageIcon size={18} /> Choisir une image
                            <input
                                type="file"
                                style={{ display: 'none' }}
                                onChange={(e) => setImage(e.target.files[0])}
                                accept="image/*"
                            />
                        </label>
                        {image && <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{image.name}</span>}
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Send size={18} /> {loading ? 'Publication...' : 'Publier l\'article'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateArticle;
