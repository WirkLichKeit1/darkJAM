[Read in English](README.en.md)

# anime-api
...

# darkJAM

Frontend de uma plataforma de streaming de animes. Construído com Next.js 16 usando o App Router, com player de vídeo customizado, painel administrativo e rastreamento completo de histórico de exibição.

## Stack

- **Next.js 16** (App Router)
- **React 19** + **TypeScript**
- **Tailwind CSS 4** + variáveis CSS para tematização
- **Axios** para requisições à API com injeção automática do JWT
- **js-cookie** para armazenamento do token
- **`proxy.ts`** para proteção de rotas na camada de edge

## Requisitos

- Node.js 18+
- npm, yarn ou pnpm
- Uma instância em execução do [anime-api](../anime-api) (o backend)

## Variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Usada somente server-side — por Route Handlers e Server Components
# Não é incluída no bundle do cliente
API_URL=http://localhost:8080

# Usada client-side pelo Axios (lib/api.ts)
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Em desenvolvimento, as duas variáveis apontam para o mesmo endereço. Em produção no Vercel, adicione ambas como variáveis de ambiente nas configurações do projeto. `API_URL` nunca é exposta ao browser.

## Executando localmente

```bash
npm install
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`.

## Build de produção

```bash
npm run build
npm run start
```

## Estrutura do projeto

```
src/
├── app/
│   ├── (admin)/admin/      # Painel admin (layout Server Component com verificação de perfil)
│   │   ├── layout.tsx      # Guard de autenticação — redireciona não-admins server-side
│   │   ├── AdminShell.tsx  # Sidebar e shell do layout (client component)
│   │   ├── page.tsx        # Dashboard com estatísticas
│   │   └── animes/         # CRUD de animes e episódios
│   ├── (auth)/             # Páginas de login e cadastro
│   ├── (main)/             # Páginas públicas
│   │   ├── animes/         # Listagem, detalhe e exibição de animes
│   │   ├── favorites/      # Favoritos do usuário
│   │   └── history/        # Histórico de exibição
│   └── api/
│       └── stream/[episodeId]/
│           └── route.ts    # Proxy server-side para streaming de vídeo
├── components/
│   ├── anime/              # AnimeCard, AnimeFilters
│   ├── layout/             # Navbar, Footer
│   ├── player/             # VideoPlayer
│   └── ui/                 # Button, Input, Badge, Skeleton
├── lib/
│   ├── api.ts              # Instância Axios e funções tipadas da API
│   ├── auth.ts             # Armazenamento do token via cookie
│   └── hooks/
│       ├── useAuth.ts      # Login, cadastro, logout
│       └── useWatchProgress.ts  # Salvamento periódico do progresso + sendBeacon no unload
├── proxy.ts                # Middleware de edge para proteção de rotas
└── types/
    └── api.ts              # Tipos TypeScript para todos os contratos da API
```

## Fluxo de autenticação

Após o login, o JWT é armazenado em um cookie via `js-cookie`. O middleware `proxy.ts` roda na camada de edge e redireciona requisições não autenticadas para `/login` com base na presença do cookie.

A proteção de rotas do painel admin opera em dois níveis:

1. **`proxy.ts`** — verificação rápida do cookie no edge, redireciona se não houver token
2. **`src/app/(admin)/admin/layout.tsx`** — Server Component que lê o cookie `user`, analisa o perfil e chama `redirect()` antes de renderizar qualquer coisa se o perfil não for `ADMIN`

Isso garante que mesmo que alguém construa manualmente um cookie com um token, o layout irá interceptar um perfil ausente ou inválido no servidor antes de qualquer interface administrativa ser enviada ao cliente.

## Streaming de vídeo

Os vídeos não são buscados diretamente do backend pelo browser. O player aponta seu `src` para `/api/stream/[episodeId]`, que é um Route Handler do Next.js responsável por:

1. Ler o JWT do cookie server-side
2. Encaminhar a requisição ao backend com o header `Authorization`
3. Repassar os headers `Range` para suporte a seek
4. Transmitir o corpo da resposta diretamente sem carregá-lo em memória

Isso mantém o JWT completamente fora do JavaScript do cliente e permite transmitir arquivos de qualquer tamanho sem sobrecarregar a memória do browser.

## Progresso de exibição

O hook `useWatchProgress` salva o progresso de reprodução no backend a cada 10 segundos durante a exibição. Quando o usuário navega para outra página ou fecha a aba, um salvamento final é enviado via `navigator.sendBeacon` para garantir que a requisição seja concluída mesmo durante o descarregamento da página.

O progresso só é salvo para usuários autenticados. A reprodução sem autenticação funciona normalmente, mas o progresso não é persistido.

## Painel administrativo

O painel administrativo está acessível em `/admin`. Apenas usuários com o perfil `ADMIN` podem acessá-lo — os demais são redirecionados para a página inicial.

Funcionalidades:

- Dashboard com contagem de animes por status
- CRUD de animes com upload de capa e banner
- CRUD de episódios com upload de vídeo e thumbnail
- Rastreamento de status do vídeo (Processando / Pronto / Erro)
- Estados de rascunho e publicado para episódios

## Deploy (Vercel)

1. Conecte o repositório a um projeto Vercel
2. Adicione as variáveis de ambiente em **Settings → Environment Variables**:
   - `API_URL` — URL do backend (ex: `https://seu-backend.onrender.com`)
   - `NEXT_PUBLIC_API_URL` — mesmo valor, exposto ao browser para o Axios
3. Faça o deploy

O arquivo `proxy.ts` é reconhecido automaticamente pelo Next.js 16 como ponto de entrada do middleware de edge.

## Lint

```bash
npm run lint
```

O ESLint está configurado com `eslint-config-next/core-web-vitals` e `eslint-config-next/typescript`.
