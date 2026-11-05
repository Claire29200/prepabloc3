import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Edit, User as UserIcon, Calendar, Mail } from 'lucide-react';

const Profile = () => {
    const { id } = useParams();
    const { user: currentUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await API.get(`/users/${id}`);
                setProfile(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id]);

    if (loading) return <div>Chargement...</div>;
    if (!profile) return <div>Utilisateur introuvable.</div>;

    const isOwnProfile = currentUser && currentUser.id === profile.id;

    return (
        <div style={{ maxWidth: '800px', margin: '40px auto' }}>
            <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ position: 'relative', width: '150px', height: '150px', margin: '0 auto 20px' }}>
                    {profile.avatar ? (
                        <img
                            src={`http://localhost:5000${profile.avatar}`}
                            alt={profile.username}
                            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--primary)' }}
                        />
                    ) : (
                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--glass-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <UserIcon size={64} color="var(--primary)" />
                        </div>
                    )}
                </div>

                <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>{profile.username}</h2>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', color: 'var(--text-muted)', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Mail size={16} /> {profile.email}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Calendar size={16} /> Inscrit le {new Date(profile.created_at).toLocaleDateString()}
                    </div>
                </div>

                {profile.bio && (
                    <div style={{ maxWidth: '500px', margin: '0 auto 30px', fontStyle: 'italic', fontSize: '1.1rem' }}>
                        "{profile.bio}"
                    </div>
                )}

                {isOwnProfile && (
                    <Link to="/profile/edit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <Edit size={18} /> Modifier mon profil
                    </Link>
                )}
            </div>
        </div>
    );
};

export default Profile;
