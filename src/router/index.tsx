import { BaseLayout } from '@/layouts/BaseLayout'
import App from '@/App'
import Home from '@/view/chat'
import ErrorPage from '@/view/error'
import { createHashRouter } from 'react-router-dom'

const withBaseLayout = (Component: React.ComponentType) => {
  function WrappedComponent() {
    return (
      <BaseLayout>
        <Component />
      </BaseLayout>
    );
  }
  return <WrappedComponent />;
}

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
  },
]) 