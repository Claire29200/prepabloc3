import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ArticleDetail from './pages/ArticleDetail';
import CreateArticle from './pages/CreateArticle';
import EditArticle from './pages/EditArticle';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="container">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/article/:id" element={<ArticleDetail />} />
            <Route path="/create" element={<ProtectedRoute><CreateArticle /></ProtectedRoute>} />
            <Route path="/edit/:id" element={<ProtectedRoute><EditArticle /></ProtectedRoute>} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
          </Routes>
          <footer style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            &copy; 2024 Blog Application - MySQL + Express + React + Node.js
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
