import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import './index.css';
import AppRoutes from './routes.jsx';
import { theme, cssVariablesResolver } from './theme.js';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      defaultColorScheme="light"
      forceColorScheme="light"
    >
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </MantineProvider>
  </StrictMode>,
);
