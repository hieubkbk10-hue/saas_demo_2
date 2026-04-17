import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui';
import { MultiImageUploader } from '../../../components/MultiImageUploader';
import type { PartnerItem } from '../_types';

export const PartnersForm = ({
  items,
  setItems,
}: {
  items: PartnerItem[];
  setItems: (items: PartnerItem[]) => void;
}) => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="text-base">Logo đối tác</CardTitle>
    </CardHeader>
    <CardContent>
      <MultiImageUploader<PartnerItem>
        items={items}
        onChange={setItems}
        folder="partners"
        imageKey="url"
        extraFields={[{ key: 'link', placeholder: 'Link website đối tác', type: 'url' }]}
        minItems={1}
        maxItems={20}
        aspectRatio="video"
        columns={4}
        showReorder={true}
        addButtonText="Thêm logo"
        layout="vertical"
      />
    </CardContent>
  </Card>
);
