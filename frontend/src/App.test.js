import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import App from './App';

test('renders login page by default for unauthenticated users', () => {
  render(
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  );
  
  // Since App redirects / to /dashboard and then to /login if not authed
  // We check for login text
  const loginElements = screen.getAllByText(/Login/i);
  expect(loginElements.length).toBeGreaterThan(0);
});
