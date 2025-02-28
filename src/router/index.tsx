import { createHashRouter } from 'react-router-dom'
import { BaseLayout } from '@/layouts/BaseLayout'
import Home from '@/view/home'
import ErrorPage from '@/view/error'


const withBaseLayout = (Component: React.ComponentType) => (
  <BaseLayout>
    <Component />
  </BaseLayout>
)

export const router = createHashRouter([
  {
    path: '/',
    element: withBaseLayout(Home)
  },
  {
    path: '/home',
    element: withBaseLayout(Home)
  },
  {
    path: '*',
    element: withBaseLayout(ErrorPage)
  },
]) 