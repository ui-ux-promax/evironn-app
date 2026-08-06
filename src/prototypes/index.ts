import './layout/layout.css';
import './ui/primitives.css';

export { PrototypeFooter } from './layout/PrototypeFooter';
export { PrototypeHeader } from './layout/PrototypeHeader';
export { PrototypeShell } from './layout/PrototypeShell';
export { mockCategories, mockProducts } from './data/fixtures';
export type {
  Category,
  Product,
  Product360Asset,
  ProductMedia,
  ProductOptionGroup,
  ProductOptionValue,
  ProductVariant,
} from './data/types';
export { findPrototypeRoute, prototypeRoutes } from './routes';
export { Badge } from './ui/Badge';
export { Button } from './ui/Button';
export { Card } from './ui/Card';
export { StatusMessage } from './ui/StatusMessage';
export { TextField } from './ui/TextField';
