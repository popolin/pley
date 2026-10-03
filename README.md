# Pley

Site de homenagem ao Pley, com fotos organizadas em álbuns, mensagens e gravações de voz. Inclui painel administrativo em `/login` para moderação e gestão de administradores.

## Desenvolvimento

Use Node.js 22.12 ou superior.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Preencha `.env.local` com a URL do Supabase, a chave pública anon e o bucket de fotos. Nunca coloque a chave `service_role` em variáveis `VITE_*`: essas variáveis são incorporadas ao frontend.

## Verificação

```sh
npm run lint
npm run test:admin
npm run build
```

## Publicação

- Instalação: `npm ci`.
- Build: `npm run build`.
- Diretório publicado: `dist`.
- Configure as variáveis de `.env.example` no ambiente de build da hospedagem.
- Configure fallback das rotas para `index.html`, permitindo acesso direto a `/login` e às demais rotas.
- Configure a URL pública e os redirecionamentos de autenticação no Supabase conforme o domínio escolhido.

O envio ao GitHub não publica automaticamente o site sem uma hospedagem conectada.

### Netlify

O arquivo `netlify.toml` define o build, a pasta `dist`, Node.js 22 e o fallback das rotas.
Em **Project configuration → Environment variables**, configure para o build:

- `VITE_SUPABASE_URL`: mesmo valor de `.env.local`.
- `VITE_SUPABASE_ANON_KEY`: chave pública anon de `.env.local`, nunca `service_role`.
- `VITE_SUPABASE_BUCKET`: `album`.

As variáveis antigas `REACT_APP_DB_KEY`, `REACT_APP_DB_USERNAME`, `DISABLE_ESLINT_PLUGIN`
e `GENERATE_SOURCEMAP` não são usadas neste projeto e podem ser removidas do Netlify.
Execute um novo deploy após mudar as variáveis, pois o Vite as incorpora durante o build.

## Supabase

Consulte [ADMIN_SETUP.md](supabase/ADMIN_SETUP.md) para autenticação e administração e [SECURITY_SETUP.md](supabase/SECURITY_SETUP.md) para cotas, uploads e publicação das Edge Functions. Alterações SQL devem ser aplicadas no banco; alterações nas funções precisam de deploy separado.

Arquivos `.env`, dependências locais e o build gerado não fazem parte do repositório. Fotos enviadas pelos visitantes ficam no Supabase Storage.
