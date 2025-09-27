import App from '@/App';
import ErrorPage from '@/page/error';
import { createHashRouter } from 'react-router-dom';

export const router = createHashRouter([
  {
    path: '/',
    element: <App />
  },
  {
    path: '/home',
    element: <App />
  },
  {
    path: '*',
    element: <ErrorPage />
  }
]);
