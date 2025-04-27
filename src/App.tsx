
import { Routes, Route, Navigate } from "react-router-dom";
import { AppProviders } from "@/components/AppProviders";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { useAuth } from "@/components/auth/AuthProvider";
import Navigation from "@/components/Navigation";
import SEO from "@/components/SEO";
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
import Notifications from "./pages/Notifications";

const App = () => {
  const { isAuthenticated } = useAuth();

  return (
    <AppProviders>
      {/* Global SEO */}
      <SEO />

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
          <Route path="/notifications" element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } />
          <Route path="/thought/:id" element={<SingleThought />} />
          <Route path="/project/:id" element={<SingleProject />} />
          <Route path="/thought/:id/edit" element={
            <ProtectedRoute>
              <EditThought />
            </ProtectedRoute>
          } />

          {/* Catch-all route for 404 */}
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
              <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
              <p className="text-muted-foreground mb-8">The page you're looking for doesn't exist or has been moved.</p>
              <button
                onClick={() => window.location.href = isAuthenticated ? '/home' : '/'}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                Go to {isAuthenticated ? 'Home' : 'Landing'} Page
              </button>
            </div>
          } />
        </Routes>
    </AppProviders>
  );
};

export default App;
