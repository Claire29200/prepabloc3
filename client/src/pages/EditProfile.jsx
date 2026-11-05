import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Save, User as UserIcon, Image as ImageIcon } from 'lucide-react';

const EditProfile = () => {
    const { user, login } = useAuth();
    const [formData, setFormData] = useState({ username: '', bio: '', password: '' });
    const [avatar, setAvatar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            const fetchProfile = async () => {
                try {
                    const { data } = await API.get(`/users/${user.id}`);
                    setFormData({ username: data.username, bio: data.bio || '', password: '' });
                } catch (err) {
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            };
            fetchProfile();
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        const data = new FormData();
        data.append('username', formData.username);
        data.append('bio', formData.bio);
        if (formData.password) data.append('password', formData.password);
        if (avatar) data.append('avatar', avatar);

        try {
            await API.put(`/users/${user.id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Update local storage/context with potentially new username/avatar
            const { data: updatedUser } = await API.get(`/users/${user.id}`);
            login(updatedUser, localStorage.getItem('token'));

            navigate(`/profile/${user.id}`);
        } catch (err) {
            console.error(err);
            alert('Erreur lors de la mise à jour du profil');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Chargement...</div>;

    return (
        <div style={{ maxWidth: '600px', margin: '40px auto' }}>
            <h2 style={{ marginBottom: '30px' }}>Modifier mon profil</h2>
            <div className="glass" style={{ padding: '30px' }}>
                <form onSubmit={handleSubmit}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Nom d'utilisateur</label>
                    <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                    />

                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Bio</label>
                    <textarea
                        placeholder="Parlez-nous de vous..."
                        rows="4"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    />

                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Nouveau mot de passe (laisser vide pour ne pas changer)</label>
                    <input
                        type="password"
                        placeholder="Minimum 6 caractères"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />

                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Avatar</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                        <label className="btn glass" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ImageIcon size={18} /> Changer l'avatar
                            <input
                                type="file"
                                style={{ display: 'none' }}
                                onChange={(e) => setAvatar(e.target.files[0])}
                                accept="image/*"
                            />
                        </label>
                        {avatar && <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{avatar.name}</span>}
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center' }}>
                        <Save size={18} /> {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditProfile;
