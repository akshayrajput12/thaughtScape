
import { Routes, Route } from "react-router-dom";
import { AppProviders } from "@/components/AppProviders";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Navigation from "@/components/Navigation";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Messages from "./pages/Messages";
import Write from "./pages/Write";
import Explore from "./pages/Explore";
import Freelancing from "./pages/Freelancing";

const App = () => (
  <AppProviders>
    <Navigation />
    <Routes>
      <Route path="/" element={<Index />} />
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
      <Route path="/messages" element={
        <ProtectedRoute>
          <Messages />
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
