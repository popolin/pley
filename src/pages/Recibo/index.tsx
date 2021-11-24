import React, { useState, useCallback, useRef } from 'react';

import { toJpeg } from 'html-to-image';

import { Image, Input, Radio, DatePicker, ConfigProvider, Divider } from 'antd';
import Text from 'antd/lib/typography/Text';
import moment from 'moment';
import 'moment/locale/pt-br';
import locale from 'antd/lib/locale/pt_BR';

import santanderImg from '../../assets/santander.jpeg';

import {
  Container,
  Content,
  ImagemRecibo,
  TextTipo,
  TextContaOrigem,
  TextNomeOrigem,
  TextContaDestino,
  TextNomeDestino,
  TextBancoDestino,
  TextCPFDestino,
  TextTipoConta,
  TextTitularidade,
  TextFinalidade,
  TextISPB,
  TextTipoTransferencia,
  TextValor,
  TextHistorico,
  TextData,
  TextAutenticacao,
} from './styles';
import ItemForm from '../../components/ItemForm';

type TipoType = 'TED' | 'DOC' | 'PIX';

const Recibo: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);

  const [tipo, setTipo] = useState<TipoType>('TED');
  const [contaOrigem, setContaOrigem] = useState('1805/01.001941.1');
  const [nomeOrigem, setNomeOrigem] = useState(
    'Osvaldo Carlos de Oliveira Chagas',
  );
  const [contaDestino, setContaDestino] = useState('2399/008320233094');
  const [nomeDestino, setNomeDestino] = useState('Nome do Golpista Aqui');
  const [bancoDestino, setBancoDestino] = useState(
    '0104 - CAIXA ECONOMICA FEDERAL',
  );
  const [cpfDestino, setCpfDestino] = useState('697.184.610-94');
  const [finalidade, setFinalidade] = useState('CREDITO EM CONTA');
  const [valor, setValor] = useState('2.000,00');
  const [historico, setHistorico] = useState('Emprestimo');
  const [data, setData] = useState(moment(new Date()));

  const handleDownload = useCallback(() => {
    if (ref.current === null) {
      return;
    }
    toJpeg(ref.current, { cacheBust: true })
      .then(dataUrl => {
        const link = document.createElement('a');
        link.download = 'comprovante_transferencia.jpeg';
        link.href = dataUrl;
        link.click();
      })
      .catch(err => {
        console.log(err);
      });
  }, [ref]);

  return (
    <Container>
      <Text
        style={{
          fontSize: 20,
        }}
      >
        Gerador de recibo para golpista otário
      </Text>
      <Text type="danger">Proibido o uso para fins maliciosos</Text>
      <Content>
        <ItemForm label="Banco">
          <Radio.Group>
            <Radio.Button value="santander">Santander</Radio.Button>
          </Radio.Group>
        </ItemForm>
        <ItemForm label="Conta Origem">
          <Input
            value={contaOrigem}
            onChange={a => setContaOrigem(a.target.value)}
          />
        </ItemForm>
        <ItemForm label="Nome Origem">
          <Input
            value={nomeOrigem}
            onChange={a => setNomeOrigem(a.target.value)}
          />
        </ItemForm>
        <ItemForm label="Conta Destino">
          <Input
            value={contaDestino}
            onChange={a => setContaDestino(a.target.value)}
          />
        </ItemForm>
        <ItemForm label="Nome Destino">
          <Input
            value={nomeDestino}
            onChange={a => setNomeDestino(a.target.value)}
          />
        </ItemForm>
        <ItemForm label="Banco Destino">
          <Input
            value={bancoDestino}
            onChange={a => setBancoDestino(a.target.value)}
          />
        </ItemForm>
        <ItemForm label="CPF Destino">
          <Input
            value={cpfDestino}
            onChange={a => setCpfDestino(a.target.value)}
          />
        </ItemForm>
        <ItemForm label="Finalidade">
          <Input
            value={finalidade}
            onChange={a => setFinalidade(a.target.value)}
          />
        </ItemForm>
        <ItemForm label="Tipo">
          <Radio.Group
            value={tipo}
            onChange={a => setTipo(a.target.value as TipoType)}
          >
            <Radio.Button value="DOC">DOC</Radio.Button>
            <Radio.Button value="TED">TED</Radio.Button>
            <Radio.Button value="PIX">PIX</Radio.Button>
          </Radio.Group>
        </ItemForm>
        <ItemForm label="Valor">
          <Input value={valor} onChange={a => setValor(a.target.value)} />
        </ItemForm>
        <ItemForm label="Histórico">
          <Input
            value={historico}
            onChange={a => setHistorico(a.target.value)}
          />
        </ItemForm>
        <ItemForm label="Data">
          <ConfigProvider locale={locale}>
            <DatePicker
              showTime
              onSelect={a => setData(a)}
              defaultValue={data}
            />
          </ConfigProvider>
        </ItemForm>
      </Content>
      <Divider />
      <Text
        type="secondary"
        style={{
          marginBottom: 16,
        }}
      >
        Clique na imagem abaixo para fazer o download do recibo:
      </Text>
      <ImagemRecibo ref={ref} onClick={handleDownload}>
        <Image
          preview={false}
          src={santanderImg}
          style={{
            width: 200,
          }}
        />
        <TextTipo>{tipo} realizado com sucesso.</TextTipo>
        <TextContaOrigem>{contaOrigem}</TextContaOrigem>
        <TextNomeOrigem>{nomeOrigem}</TextNomeOrigem>
        <TextContaDestino>{contaDestino}</TextContaDestino>
        <TextNomeDestino>{nomeDestino}</TextNomeDestino>
        <TextBancoDestino>{bancoDestino}</TextBancoDestino>
        <TextCPFDestino>{cpfDestino}</TextCPFDestino>
        <TextTipoConta>Conta Corrende Individual</TextTipoConta>
        <TextTitularidade>Outra Titularidade</TextTitularidade>
        <TextFinalidade>{finalidade}</TextFinalidade>
        <TextISPB>00370507</TextISPB>
        <TextTipoTransferencia>{tipo}</TextTipoTransferencia>
        <TextValor>R$ {valor}</TextValor>
        <TextHistorico>{historico}</TextHistorico>
        <TextData>{data.format('DD/MM/YYYY HH:mm:ss')}</TextData>
        <TextAutenticacao>MTT9443BAD20A59B993054F8</TextAutenticacao>
      </ImagemRecibo>
    </Container>
  );
};

export default Recibo;
