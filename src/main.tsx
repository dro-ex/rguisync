
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Apply default theme class based on localStorage or system preference
const darkModePreference = localStorage.getItem('darkMode') === 'true' || 
  (localStorage.getItem('darkMode') === null && 
   window.matchMedia('(prefers-color-scheme: dark)').matches);

document.documentElement.classList.toggle('dark', darkModePreference);
document.documentElement.classList.toggle('light', !darkModePreference);

// Create app root
const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
} else {
  console.error("Root element not found");
}
