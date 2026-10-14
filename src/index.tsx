import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import '@fontsource-variable/fraunces/wght.css';
import '@fontsource-variable/nunito/wght.css';
import './styles/tokens.css';
import './styles/themes/paper.css';
import './styles/themes/midnight.css';
import './styles/global.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
