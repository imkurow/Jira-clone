import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import TopNav from './components/layout/TopNav';
import Board from './components/board/Board';
import Backlog from './pages/Backlog';
import Reports from './pages/Reports';
import SearchResults from './pages/SearchResults';
import CreateIssueModal from './components/issue/CreateIssueModal';
import Auth from './pages/Auth';
import { BoardProvider } from './context/BoardContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';

// IMPORTANT: Replace this placeholder with your actual Google Client ID from the Google Cloud Console
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return children;
};

const MainLayout = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <BoardProvider>
      <div className="app-container">
        <Sidebar onCreateIssue={() => setIsModalOpen(true)} />
        <div className="main-content">
          <TopNav />
          <main className="page-content">
            <Routes>
              <Route path="/" element={<Navigate to="/board" />} />
              <Route path="/board" element={<Board />} />
              <Route path="/backlog" element={<Backlog />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/search" element={<SearchResults />} />
            </Routes>
          </main>
        </div>
      </div>
      <CreateIssueModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </BoardProvider>
  );
};

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
