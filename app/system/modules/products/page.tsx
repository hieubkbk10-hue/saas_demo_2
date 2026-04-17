'use client';

import { ModuleConfigPage } from '@/components/modules/ModuleConfigPage';
import { productsModule } from '@/lib/modules/configs/products.config';

export default function ProductsModuleConfigPage() {
  return (
    <ModuleConfigPage config={productsModule} />
  );
}
