import React from 'react';

import { ItemLine, ItemLabel, ItemValue } from './styles';

interface ItemFormProps {
  label: string;
}

const ItemForm: React.FC<ItemFormProps> = ({ label, children }) => {
  return (
    <ItemLine>
      <ItemLabel type="secondary">{label}:</ItemLabel>
      <ItemValue>{children}</ItemValue>
    </ItemLine>
  );
};

export default ItemForm;
