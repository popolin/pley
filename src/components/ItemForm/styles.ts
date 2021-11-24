import Text from 'antd/lib/typography/Text';
import styled from 'styled-components';

export const ItemLine = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  margin-top: 6px;
`;

export const ItemLabel = styled(Text)`
  width: 100px;
  display: flex;
  justify-content: flex-end;
  margin-right: 10px;
`;

export const ItemValue = styled(Text)`
  width: 300px;
  display: flex;
  justify-content: flex-start;
  margin-right: 10px;
`;
