import React from 'react';

import { Divider } from 'antd';
import { FrownTwoTone } from '@ant-design/icons';
import Text from 'antd/lib/typography/Text';
import { Container, Content } from './styles';

const Out: React.FC = () => {
  return (
    <Container>
      <Text
        style={{
          fontSize: 20,
        }}
      >
        Gerador de recibo para golpista otário
      </Text>
      <Content>
        <Text type="secondary">
          A intenção era trolar golpistas, mas acabei facilitando a vida deles,
          de forma geral. Portanto decidimos encerrar o serviço.
        </Text>
        <Text type="secondary">
          Após quase <Text underline>3700</Text> recibos baixados, termina aqui
          nossa história de 1 dia.
        </Text>
        <FrownTwoTone
          twoToneColor="#eb2f96"
          style={{
            fontSize: 34,
          }}
        />
        <Divider />
        <Text>Muito obrigado por nos apoiar,</Text>
        <Text type="secondary">até logo</Text>
        <Text
          type="secondary"
          style={{
            marginTop: 20,
          }}
        >
          e Feliz Natal!
        </Text>
      </Content>
    </Container>
  );
};

export default Out;
