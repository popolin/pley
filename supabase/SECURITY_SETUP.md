# Ativação das proteções

1. Publique as funções `submit-publication` e `manage-admin`:
   `supabase functions deploy submit-publication --project-ref SEU_PROJECT_REF`
   `supabase functions deploy manage-admin --project-ref SEU_PROJECT_REF`
2. Execute `security.sql` no SQL Editor **depois** de `schema.sql`, `admins.sql`
   e `admin-audios.sql`. O schema completo já contém o bloco no final.
3. Publique o frontend atualizado junto com essa mudança. O frontend antigo
   envia diretamente ao banco/Storage e deixará de funcionar após o passo 2.
4. Se reexecutar os SQLs anteriores isoladamente, reaplique `security.sql` por
   último para não restaurar as permissões antigas de envio público.

Não foram aplicadas mudanças no projeto remoto automaticamente.

## Limites efetivos no servidor

| Operação | Por minuto | Por 24 horas |
| --- | ---: | ---: |
| Fotos | 10 | 100 |
| Áudios | 5 | 20 |
| Mensagens | 5 | 100 |

As cotas são **globais para o site**, não por IP. São janelas de duração fixa
iniciadas no primeiro envio, com atualização atômica no Postgres. Não dependem
do navegador ou de cabeçalhos de IP forjáveis. Uploads que falham após reservar
uma cota também consomem a cota. Mensagens e uploads devem usar a função:
INSERT público no banco e upload público direto no Storage foram desabilitados.

- Foto: até 8 MiB, miniatura JPEG até 1 MiB; entrada JPG/PNG/WebP no navegador,
  reencodificada para JPEG. O bucket mantém o teto de 8 MiB.
- Áudio: até 20 MiB; extensão armazenada deriva da assinatura inicial validada
  pelo servidor, não do nome enviado pelo visitante.
- Corpo multipart: até 22 MiB, com leitura limitada mesmo sem Content-Length.
- Arquivos vazios, tipos não suportados e campos acima dos limites são recusados.
- Nomes de objetos são UUIDs gerados no servidor; visitantes não escolhem caminhos.
- Falha ao gravar metadados tenta remover os arquivos recém-enviados.
- Contador público de plays: teto global de 120 incrementos/minuto.
- RPCs administrativas de áudio: 120 chamadas/minuto por admin.
- Cadastro/edição de admins: 20 chamadas/minuto por admin na função de servidor.
- Interface: apenas um envio público simultâneo e intervalo mínimo de 1,5 s.

## Limites destas proteções

Estas cotas limitam as gravações aceitas, não todo tráfego recebido. Um atacante
pode consumir a cota global e impedir contribuições legítimas até a próxima
janela. Leituras públicas e downloads continuam públicos e não têm rate limit
adicional nesta implementação. A inspeção de assinatura não substitui antivírus
nem validação completa do codec. Falhas de rede durante limpeza podem deixar
arquivos órfãos para manutenção posterior.

No Supabase, revise **Authentication → Rate Limits**: o Auth já possui limites
próprios de login. Desabilite cadastro público de usuários se não for utilizado
(o cadastro pelo servidor usa a API administrativa). Não ative CAPTCHA sem
integrar primeiro o token ao frontend, pois isso bloquearia o login atual.

Para proteção por IP/CAPTCHA e contra tráfego volumétrico, é necessário configurar
uma camada de borda e/ou um serviço de verificação de bots com credenciais do
projeto; isso não está implementado aqui. Não confie em limites somente no JS ou
em CORS para impedir chamadas diretas.

Referências:
- https://supabase.com/docs/guides/auth/rate-limits
- https://supabase.com/docs/guides/storage/uploads/file-limits
