import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { Layout } from './components/ui';
import Login from './pages/Login';
import Home from './pages/Home';
import InspectionPage from './pages/Inspection';
import Findings from './pages/Findings';
import Dashboard from './pages/Dashboard';
import Master from './pages/Master';
import Reports from './pages/Reports';
import Admin from './pages/Admin';
import Activity from './pages/Activity';
import Monitoring from './pages/Monitoring';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Home />} />
            <Route path="/inspect" element={<InspectionPage />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/findings" element={<Findings />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/master" element={<Master />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  );
}
