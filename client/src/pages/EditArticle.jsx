import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../api/axios';
import { Image as ImageIcon, Save } from 'lucide-react';

const EditArticle = () => {
    const { id } = useParams();
    const [formData, setFormData] = useState({ title: '', content: '' });
    const [image, setImage] = useState(null);
    const [currentImage, setCurrentImage] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const { data } = await API.get(`/articles/${id}`);
                setFormData({ title: data.title, content: data.content });
                setCurrentImage(data.image);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchArticle();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        const data = new FormData();
        data.append('title', formData.title);
        data.append('content', formData.content);
        if (image) data.append('image', image);

        try {
            await API.put(`/articles/${id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            navigate(`/article/${id}`);
        } catch (err) {
            console.error(err);
            alert('Erreur lors de la modification de l\'article');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Chargement...</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '40px auto' }}>
            <h2 style={{ marginBottom: '30px' }}>Modifier l'article</h2>
            <div className="glass" style={{ padding: '30px' }}>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Titre"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                    />
                    <textarea
                        placeholder="Contenu"
                        rows="12"
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        required
                    />

                    <div style={{ marginBottom: '30px' }}>
                        {currentImage && (
                            <div style={{ marginBottom: '10px' }}>
                                <p style={{ fontSize: '0.9rem', marginBottom: '5px' }}>Image actuelle :</p>
                                <img src={`http://localhost:5000${currentImage}`} alt="preview" style={{ height: '100px', borderRadius: '8px' }} />
                            </div>
                        )}
                        <label className="btn glass" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', width: 'fit-content' }}>
                            <ImageIcon size={18} /> {currentImage ? 'Changer l\'image' : 'Ajouter une image'}
                            <input type="file" style={{ display: 'none' }} onChange={(e) => setImage(e.target.files[0])} />
                        </label>
                        {image && <span style={{ marginLeft: '10px' }}>{image.name}</span>}
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Save size={18} /> {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditArticle;
