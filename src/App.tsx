
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppProviders } from "@/components/AppProviders";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Navigation from "@/components/Navigation";
import LoadingScreen from "@/components/LoadingScreen";

// Lazy load pages
const Home = lazy(() => import("./pages/home"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/profile"));
const Admin = lazy(() => import("./pages/admin"));
const Messages = lazy(() => import("./pages/messages"));
const Write = lazy(() => import("./pages/write"));
const Explore = lazy(() => import("./pages/explore"));
const Freelancing = lazy(() => import("./pages/freelancing"));

const App = () => (
  <AppProviders>
    <Navigation />
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route 
          path="/explore" 
          element={
            <ProtectedRoute>
              <Explore />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile/:id" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/messages" 
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/write" 
          element={
            <ProtectedRoute>
              <Write />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/freelancing" 
          element={
            <ProtectedRoute>
              <Freelancing />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  </AppProviders>
);

export default App;
