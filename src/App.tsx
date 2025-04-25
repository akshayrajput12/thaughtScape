
import { Routes, Route, Navigate } from "react-router-dom";
import { AppProviders } from "@/components/AppProviders";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/components/auth/AuthProvider";
import Navigation from "@/components/Navigation";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Write from "./pages/Write";
import Explore from "./pages/Explore";
import Freelancing from "./pages/Freelancing";

const App = () => {
  const { isAuthenticated } = useAuth();

  return (
    <AppProviders>
      <Navigation />
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/home" replace /> : <Landing />} />
        <Route path="/home" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="/auth" element={<Auth />} />
        <Route path="/explore" element={
          <ProtectedRoute>
            <Explore />
          </ProtectedRoute>
        } />
        <Route path="/profile/:id" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        } />
        <Route path="/write" element={
          <ProtectedRoute>
            <Write />
          </ProtectedRoute>
        } />
        <Route path="/freelancing" element={
          <ProtectedRoute>
            <Freelancing />
          </ProtectedRoute>
        } />
      </Routes>

      {/* Add padding to bottom on mobile when authenticated to account for bottom navigation */}
      {isAuthenticated && (
        <div className="md:hidden h-16" />
      )}
    </AppProviders>
  );
};

export default App;
