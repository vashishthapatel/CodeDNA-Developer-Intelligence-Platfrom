import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Repositories from './pages/Repositories';
import Analytics from './pages/Analytics';
import Recommendations from './pages/Recommendations';
import RefactorIQDashboard from './pages/RefactorIQ/RefactorIQDashboard';
import RefactorIQAnalysis from './pages/RefactorIQ/RefactorIQAnalysis';
import RefactorIQIssueDetails from './pages/RefactorIQ/RefactorIQIssueDetails';
import RefactorIQStudio from './pages/RefactorIQ/RefactorIQStudio';
import RefactorIQComparison from './pages/RefactorIQ/RefactorIQComparison';
import { ProfileProvider } from './lib/ProfileContext';

export default function App() {
  return (
    // One GitHub fetch for the whole dashboard, above the router so navigating
    // between pages never re-spends the rate limit.
    <ProfileProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="repositories" element={<Repositories />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="recommendations" element={<Recommendations />} />

          {/* RefactorIQ Central Feedback Loop Routes */}
          <Route path="refactoriq" element={<RefactorIQDashboard />} />
          <Route path="refactoriq/analysis/:id" element={<RefactorIQAnalysis />} />
          <Route path="refactoriq/issues/:id" element={<RefactorIQIssueDetails />} />
          <Route path="refactoriq/refactor/:id" element={<RefactorIQStudio />} />
          <Route path="refactoriq/comparison/:beforeId/:afterId" element={<RefactorIQComparison />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ProfileProvider>
  );
}
