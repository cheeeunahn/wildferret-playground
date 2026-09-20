import { Outlet } from 'react-router-dom';
import PageShell from './PageShell';

// Same frame as the site, without the header or navigation: for unlisted
// pages that stand on their own.
export default function BareLayout() {
  return (
    <PageShell>
      <Outlet />
    </PageShell>
  );
}
