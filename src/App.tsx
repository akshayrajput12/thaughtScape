
import { Routes, Route } from "react-router-dom";
import { AppProviders } from "@/components/AppProviders";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Navigation from "@/components/Navigation";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Write from "./pages/Write";
import Explore from "./pages/Explore";
import Freelancing from "./pages/Freelancing";

const App = () => (
  <AppProviders>
    <Navigation />
    <Routes>
      <Route path="/" element={<Landing />} />
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
  </AppProviders>
);

export default App;
