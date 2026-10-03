# Ativar a administração

## Paginação de fotos

Antes de publicar o frontend atualizado, execute `photo-pagination.sql` no SQL Editor (após `admin-home-photos.sql`, `admins.sql` e `rate-limits.sql`). As funções também estão incluídas em `schema.sql`.

- Administração: 24 fotos por página, com status, álbum, busca por autor/legenda e seleção para a home filtrados no banco. Contadores consideram toda a coleção; seleção em lote vale somente para a página atual.
- Galeria pública: 12 álbuns por página, ordenados pela foto cadastrada mais recentemente, com até três capas por álbum. Busca por nome de álbum.
- Dentro do álbum: 24 fotos por página, busca por legenda/descrição, ano de captura em UTC e ordenação por data de captura (ou cadastro quando ausente). Os anos disponíveis consideram todo o álbum.
- A home continua limitada às sete fotos selecionadas. As novas funções públicas respeitam RLS e retornam somente fotos aprovadas; a consulta administrativa exige administrador ativo.

O lightbox navega pelas fotos da página atual. Ao trocar filtro ou página, a seleção anterior é descartada. As listagens usam offset e desempate por ID; novas inserções durante a navegação podem deslocar os limites das páginas.

## Amostra de áudios do player

Execute `audio-sample.sql` no SQL Editor antes de publicar o frontend com a fila de áudios. O player mantém até 15 gravações e reabastece em segundo plano quando restam três. A RPC retorna apenas gravações aprovadas, respeita RLS e prioriza áudios não reproduzidos recentemente. Em catálogos pequenos, gravações podem voltar à fila. Uma reprodução confirmada retira o item da fila; pausar e retomar não retira outro item.

## Fotos da página inicial

Execute `admin-home-photos.sql` após `admins.sql` e `rate-limits.sql` para habilitar a seleção de fotos da home em um banco existente. A estrutura também está incluída em `schema.sql`.

No painel de fotos, use “Exibir na home” ou “Retirar da home”, individualmente ou com várias fotos selecionadas. Só fotos aprovadas e marcadas aparecem na home. O mosaico mostra até sete; se houver mais, são escolhidas as sete com cadastro mais recente. Nenhuma foto é marcada automaticamente ao aplicar a migração. Os álbuns continuam exibindo as fotos aprovadas normalmente.

O login e a gestão de administradores usam Supabase Auth + `public.admins`.
Mensagens, fotos, álbuns, áudios, administradores e autenticação usam dados reais. Nenhuma senha é armazenada em `public.admins`.

## 1. Banco

No SQL Editor do projeto, execute `supabase/admins.sql` para adicionar somente a
estrutura administrativa ao banco existente. A mesma estrutura está no final de
`supabase/schema.sql` para instalações completas. Ambos são reexecutáveis.

Status: `active` e `inactive`. Não há operação de exclusão. Um admin inativo perde
permissão de ler qualquer registro de admins (inclusive o próprio), alterar status ou chamar a função de cadastro,
mesmo com JWT ainda válido. O frontend revalida no foco da janela e a cada minuto.
A RPC serializa mudanças de status e impede desativar o último admin ativo.

## 2. Primeiro administrador

Crie o primeiro usuário em **Authentication → Users → Add user**, com e-mail,
senha e e-mail confirmado. Em seguida, execute no SQL Editor, substituindo os
valores abaixo pelo nome e e-mail desse usuário:

```sql
insert into public.admins (id, name, email, status)
select id, 'Seu nome', lower(email), 'active'
from auth.users
where lower(email) = lower('seu-email@exemplo.com')
on conflict (id) do nothing;
```

Confira que uma linha foi inserida. O cadastro público de um usuário Auth **não**
concede acesso administrativo: é necessário um registro ativo em `admins`.
Não use mais as credenciais fictícias `admin@pley.com / pley1234`.

## 3. Função de cadastro e edição

Publique a Edge Function com a CLI Supabase autenticada, a partir da raiz:

```sh
supabase functions deploy manage-admin --project-ref SEU_PROJECT_REF
```

`supabase/config.toml` desabilita a verificação JWT do gateway para esta função;
a própria função valida o token com `auth.getUser()` e consulta o status ativo no
banco antes de qualquer operação. Não remova essas verificações.

No ambiente hospedado, `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são fornecidas
pelo Supabase. Nunca configure a service role em uma variável `VITE_*` ou no
frontend. O navegador usa somente as variáveis públicas já definidas em
`.env.example`.

A criação provisiona o usuário em Auth, confirmado, e seu perfil ativo. Se a
criação do perfil falhar, tenta desfazer apenas o novo usuário Auth ainda sem
perfil. A edição altera somente o nome pela API administrativa de Auth; um trigger
sincroniza o perfil na mesma transação e bloqueia mudanças de e-mail para usuários
que já possuem registro em `admins`, inclusive inativos. Status nunca é extraído de metadados do
usuário. A API não altera senhas de admins existentes.

## 4. Verificação

- Entre em `/login` com o primeiro usuário; a tela inicial é Administradores.
- Cadastre um segundo admin; saia e entre com as novas credenciais.
- Edite o nome e confirme a atualização na lista. O e-mail é somente leitura;
  tentativas de alterá-lo pela função ou pelo Auth são bloqueadas.
- Desative o segundo admin usando o primeiro; tente entrar com o inativo.
- Reative-o e confira que o acesso foi restabelecido.
- Tente desativar o último ativo; a operação deve ser bloqueada no banco.
- Recarregue a página e confirme a restauração da sessão.

Verificações locais:

```sh
npm run test:admin
npm run build
npm run lint
```

Os testes locais simulam as respostas do Supabase; não substituem a verificação
integrada após executar o SQL e publicar a função.

Referências: https://supabase.com/docs/reference/javascript/auth-admin-createuser
 e https://supabase.com/docs/reference/javascript/auth-getuser

## Administração de áudios

Execute `supabase/admin-audios.sql` após `admins.sql` em bancos existentes.
Em instalações novas, o mesmo bloco já está no final de `schema.sql`.
Não requer nova Edge Function. As três RPCs verificam admin ativo no servidor;
não concedem UPDATE direto nem modificam o contador de reproduções.
A listagem administrativa inclui todos os status. A leitura pública continua
restrita aos aprovados. O player de revisão não incrementa a contagem pública.
Teste listar como admin, editar nome/legenda, aprovar/reprovar individualmente e
em lote, retornar a pendente e tentar as RPCs com usuário inativo/não admin.

## Proteções de envio

Após os scripts acima, aplique também `security.sql`. Veja `SECURITY_SETUP.md`
para a ordem de publicação das funções e do frontend. Esse arquivo deve ser
reaplicado por último caso os scripts de permissões anteriores sejam reexecutados.

## Administração de fotos

Em bancos existentes, execute `rate-limits.sql` e depois `admin-photos.sql`.
Se `security.sql` já foi aplicado, a infraestrutura de rate limit já existe.
O schema completo já inclui essas funções. Não é necessária nova Edge Function.
A listagem, edição, moderação, contagem e criação de álbum exigem admin ativo.
Listagem, edição, moderação e criação de álbum compartilham a cota de 120
chamadas/minuto por admin. Até 500 fotos podem ser moderadas por chamada.

Confira: pendências no menu, visualização da foto original, edição de nome,
legenda e descrição, seleção/remoção de álbum, criação de álbum (incluindo
rejeição de nome duplicado), aprovação/reprovação em lote e retorno a pendente.
Criar álbum o salva imediatamente; salve a edição da foto para vinculá-la.
Arquivos e caminhos de Storage não são alterados pela edição.

Se a listagem retornar `3F000: schema "private" does not exist`, execute
`rate-limits.sql` e clique em Atualizar. Esse script não altera permissões de uploads.

## Filtros e manutenção de álbuns

Execute `admin-albums.sql` após `admin-photos.sql` e `rate-limits.sql`.
O schema completo já inclui essas operações. Selecione um álbum abaixo dos
status para acessar Renomear e Excluir álbum vazio. A exclusão confere fotos de
todos os status no banco e bloqueia atribuições concorrentes durante a operação.
Mover selecionadas altera apenas o álbum, preservando status e metadados; aceita
até 500 fotos por operação e permite escolher Sem álbum.
Todas as mutações exigem admin ativo e compartilham o rate limit administrativo.

## Administração de mensagens

Execute `admin-messages.sql` após `admins.sql` e `rate-limits.sql`.
O schema completo também contém estas funções. Listagem, edição, moderação e
contagem de pendências exigem admin ativo; nenhuma permissão de UPDATE direto é
concedida ao navegador. Listagem, edição e moderação compartilham o limite de
120 RPCs/minuto por admin. Até 500 mensagens podem ser moderadas por chamada.
A área de mensagens deixou de usar os dados mockados do painel.
