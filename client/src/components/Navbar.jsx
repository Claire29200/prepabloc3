import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, PlusSquare, Home } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="glass" style={{ margin: '20px 0', padding: '15px 0' }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--primary)' }}>Blog</span>Node
                </Link>

                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Home size={18} /> Accueil
                    </Link>

                    {user ? (
                        <>
                            <Link to="/create" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <PlusSquare size={18} /> Publier
                            </Link>
                            <Link to={`/profile/${user.id}`} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                {user.avatar ? (
                                    <img
                                        src={`http://localhost:5000${user.avatar}`}
                                        alt="avatar"
                                        style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                                    />
                                ) : <User size={18} />}
                                Profil
                            </Link>
                            <button onClick={handleLogout} className="btn btn-primary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <LogOut size={16} /> Quitter
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login">Connexion</Link>
                            <Link to="/register" className="btn btn-primary" style={{ padding: '8px 16px' }}>S'inscrire</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
