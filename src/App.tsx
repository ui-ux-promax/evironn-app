import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProductPage } from './pages/ProductPage';
import { publicRoutes } from './routes';

export default function App() {
  const [homeRoute, productRoute] = publicRoutes;
  const pathname = window.location.pathname;

  if (pathname === homeRoute) return <HomePage />;
  if (pathname === productRoute) return <ProductPage />;

  return <NotFoundPage />;
}
