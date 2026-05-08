import { Navigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/useAppContext';
import { canAccessPage, getRoleHomePath } from '../utils/userRoles';

export default function ProtectedRoute({ children, requiredPath }) {
  const { state } = useAppContext();
  const location = useLocation();
  
  // Check if user is logged in
  if (!state.profile.email) {
    return <Navigate to="/login" replace />;
  }

  // Check if the current path is allowed for this role
  const currentPath = location.pathname;
  const pathToCheck = requiredPath || currentPath;
  
  if (!canAccessPage(state.profile.role, pathToCheck)) {
    return <Navigate to={getRoleHomePath(state.profile.role)} replace />;
  }

  return children;
}
