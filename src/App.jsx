import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MyLists from './pages/MyLists';
import AllLists from './pages/AllLists';
import CreateList from './pages/CreateList';
import Settings from './pages/Settings';
import MyAtestate from './pages/MyAtestate';
import AllAtestate from './pages/AllAtestate';
import CreateAtestat from './pages/CreateAtestat';
import Sidebar from './components/Sidebar';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppLayout = () => {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard user={user} />} />
          <Route path="/my-lists" element={<MyLists user={user} />} />
          <Route path="/all-lists" element={<AllLists user={user} />} />
          <Route path="/create-list" element={<CreateList user={user} />} />
          <Route path="/settings" element={<Settings user={user} />} />
          <Route path="/my-atestate" element={<MyAtestate user={user} />} />
          <Route path="/all-atestate" element={<AllAtestate user={user} />} />
          <Route path="/create-atestat" element={<CreateAtestat user={user} />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
