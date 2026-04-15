import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ user, children }) {
  if (user === null) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}