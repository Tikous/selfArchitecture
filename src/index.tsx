import App from '@pages/App'
import './index.css';
import './wdyr'
import { createRoot } from 'react-dom/client';

const container = document.getElementById('app');
if (!container) {
  throw new Error('Failed to find the root element');
}
const root = createRoot(container);

root.render(<App />);
