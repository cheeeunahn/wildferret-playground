import { Navigate, Route, Routes } from 'react-router-dom';
import SiteLayout from './layout/SiteLayout';
import SongsPage from './pages/SongsPage';
import ToolsPage from './pages/ToolsPage';
import ToolPage from './pages/ToolPage';
import NotFoundPage from './pages/NotFoundPage';

// /songs/ and /tools/ are the two tabs; /tools/<id>/ is one tool on its own
// page, outside the site chrome.
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/songs/" replace />} />

      <Route element={<SiteLayout />}>
        <Route path="/songs" element={<SongsPage />} />
        <Route path="/tools" element={<ToolsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="/tools/:toolId" element={<ToolPage />} />
    </Routes>
  );
}
