import { Navigate, Route, Routes } from 'react-router-dom';
import { DEFAULT_FEATURE, FEATURES } from '../features';
import SiteLayout from '../shared/layouts/SiteLayout';
import NotFoundPage from '../shared/pages/NotFoundPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={`/${DEFAULT_FEATURE.path}/`} replace />}
      />

      <Route element={<SiteLayout />}>
        {FEATURES.map(({ id, path, Component }) => (
          <Route key={id} path={path} element={<Component />} />
        ))}
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {FEATURES.flatMap((feature) => feature.standaloneRoutes ?? []).map(
        ({ path, Component }) => (
          <Route key={path} path={path} element={<Component />} />
        ),
      )}
    </Routes>
  );
}
