import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import '@fontsource-variable/fraunces/wght.css';
import '@fontsource-variable/fredoka/wght.css';
import '@fontsource-variable/nunito/wght.css';
import '@fontsource-variable/pixelify-sans/wght.css';
// The shared tokens come first: a theme overrides them, and the later rule wins.
import './styles/tokens.css';
import './styles/themes/paper.css';
import './styles/themes/arcade.css';
import './styles/themes/seaside.css';
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
