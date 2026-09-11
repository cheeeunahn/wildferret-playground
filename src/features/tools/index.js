import ToolPage from './ToolPage';
import ToolsPage from './ToolsPage';

export const toolsFeature = {
  id: 'tools',
  label: 'tools',
  path: 'tools',
  Component: ToolsPage,
  standaloneRoutes: [
    { path: 'tools/:toolId', Component: ToolPage },
  ],
};
