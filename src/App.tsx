
import { Routes, Route, Navigate } from "react-router-dom";
import { AppProviders } from "@/components/AppProviders";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
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
import SingleThought from "./pages/SingleThought";
import SingleProject from "./pages/SingleProject";
import EditThought from "./pages/EditThought";

const App = () => {
  const { isAuthenticated } = useAuth();

  return (
    <AppProviders>
      <Navigation />
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/home" replace /> : <Landing />} />
        <Route path="/auth" element={isAuthenticated ? <Navigate to="/home" replace /> : <Auth />} />
        <Route path="/home" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
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
            <AdminRoute>
              <Admin />
            </AdminRoute>
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
        <Route path="/thought/:id" element={<SingleThought />} />
        <Route path="/project/:id" element={<SingleProject />} />
        <Route path="/thought/:id/edit" element={
          <ProtectedRoute>
            <EditThought />
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
