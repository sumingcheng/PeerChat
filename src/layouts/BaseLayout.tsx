import { PropsWithChildren } from 'react';
import App from '@/App';

export const BaseLayout = ({ children }: PropsWithChildren) => {
  return <App>{children}</App>;
};
