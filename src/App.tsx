import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { Spinner } from './components/ui';
import { useAuth, type Role } from './lib/auth';
import Admins from './pages/Admins';
import Analytics from './pages/Analytics';
import Audit from './pages/Audit';
import Blocks from './pages/Blocks';
import Broadcasts from './pages/Broadcasts';
import Dashboard from './pages/Dashboard';
import Integrations from './pages/Integrations';
import Login from './pages/Login';
import Photos from './pages/Photos';
import Premium from './pages/Premium';
import Reference from './pages/Reference';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import UserDetail from './pages/UserDetail';
import Users from './pages/Users';
import Verifications from './pages/Verifications';

function Guard({ roles, children }: { roles?: Role[]; children: JSX.Element }) {
  const { can } = useAuth();
  return !roles || can(...roles) ? children : <Navigate to="/" replace />;
}

export default function App() {
  const { admin, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!admin) return <Login />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="users" element={<Users />} />
        <Route path="users/:id" element={<UserDetail />} />
        <Route path="photos" element={<Photos />} />
        <Route path="reports" element={<Reports />} />
        <Route path="verifications" element={<Verifications />} />
        <Route path="blocks" element={<Blocks />} />
        <Route path="reference" element={<Reference />} />
        <Route path="broadcasts" element={<Guard roles={['admin', 'moderator', 'support']}><Broadcasts /></Guard>} />
        <Route path="settings" element={<Guard roles={['admin']}><Settings /></Guard>} />
        <Route path="premium" element={<Guard roles={['admin']}><Premium /></Guard>} />
        <Route path="integrations" element={<Guard roles={['admin']}><Integrations /></Guard>} />
        <Route path="admins" element={<Guard roles={[]}><Admins /></Guard>} />
        <Route path="audit" element={<Guard roles={[]}><Audit /></Guard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
