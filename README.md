[🇺🇸 Read in English](README.en.md)

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
# Nunca é incluída no bundle do cliente
API_URL=http://localhost:8080

# Usada client-side pelo Axios (lib/api.ts)
NEXT_PUBLIC_API_URL=http://localhost:8080

# Cloudinary — necessário para upload de vídeo pelo painel admin
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=seu-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=seu-upload-preset
```

Em desenvolvimento, `API_URL` e `NEXT_PUBLIC_API_URL` apontam para o mesmo endereço. Em produção no Vercel, adicione todas como variáveis de ambiente nas configurações do projeto. `API_URL` nunca é exposta ao browser.

### Configurando o upload preset do Cloudinary

O upload de vídeo usa o Cloudinary Upload Widget com um preset **unsigned**. Para criá-lo:

1. Acesse [console.cloudinary.com](https://console.cloudinary.com) → **Settings → Upload → Upload presets → Add preset**
2. Configure:
   - **Signing mode:** Unsigned
   - **Allowed formats:** mp4, mkv, avi, webm
   - **Async:** desabilitado (importante — async impede o callback de sucesso de disparar)
3. Salve e copie o nome do preset para `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`

> **Atenção:** o plano gratuito do Cloudinary limita uploads a 100 MB por arquivo. Para vídeos maiores, é necessário um plano pago ou comprimir o arquivo antes do envio.

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
│   ├── (admin)/admin/        # Painel admin
│   │   ├── layout.tsx        # Guard — redireciona não-admins server-side
│   │   ├── AdminShell.tsx    # Sidebar e layout (client component)
│   │   ├── page.tsx          # Dashboard com estatísticas
│   │   └── animes/           # CRUD de animes e episódios
│   │       └── [id]/episodes/
│   │           └── EpisodeForm.tsx  # Formulário com Cloudinary Upload Widget
│   ├── (auth)/               # Páginas de login e cadastro
│   ├── (main)/               # Páginas públicas
│   │   ├── animes/           # Listagem, detalhe e exibição
│   │   ├── favorites/        # Favoritos do usuário
│   │   └── history/          # Histórico de exibição
│   └── api/
│       └── stream/[episodeId]/
│           └── route.ts      # Proxy server-side para streaming de vídeo
├── components/
│   ├── anime/                # AnimeCard, AnimeFilters
│   ├── layout/               # Navbar, Footer
│   ├── player/               # VideoPlayer
│   └── ui/                   # Button, Input, Badge, Skeleton
├── lib/
│   ├── api.ts                # Instância Axios e funções tipadas da API
│   ├── auth.ts               # Armazenamento do token via cookie
│   └── hooks/
│       ├── useAuth.ts        # Login, cadastro, logout
│       └── useWatchProgress.ts # Salvamento periódico + sendBeacon no unload
├── proxy.ts                  # Middleware de edge para proteção de rotas
└── types/
    └── api.ts                # Tipos TypeScript para todos os contratos da API
```

## Fluxo de autenticação

Após o login, o JWT é armazenado em um cookie via `js-cookie`. O middleware `proxy.ts` roda na camada de edge e redireciona requisições não autenticadas para `/login` com base na presença do cookie.

A proteção de rotas do painel admin opera em dois níveis:

1. **`proxy.ts`** — verificação rápida do cookie no edge; redireciona se não houver token
2. **`src/app/(admin)/admin/layout.tsx`** — Server Component que lê o cookie `user`, valida a role e chama `redirect()` antes de renderizar qualquer coisa se a role não for `ADMIN`

Isso garante que mesmo que alguém construa manualmente um cookie com um token, o layout irá interceptar uma role inválida no servidor antes de qualquer interface administrativa ser enviada ao cliente.

## Imagens (Cloudinary)

As imagens (capas, banners, thumbnails) são servidas diretamente pelo CDN do Cloudinary. O backend retorna URLs completas (`https://res.cloudinary.com/...`) nos campos `coverImageUrl`, `bannerImageUrl` e `thumbnailUrl`. O frontend usa essas URLs diretamente no componente `<Image>` do Next.js — sem passar pelo backend.

O `next.config.ts` tem `res.cloudinary.com` configurado nos `remotePatterns` para que o componente `<Image>` aceite as URLs.

## Upload de vídeo

O upload de vídeo funciona de forma completamente direta — o arquivo vai do browser para o Cloudinary sem passar pelo servidor backend (Render) ou pelo proxy do Vercel:

1. Admin preenche o formulário e clica em **"Criar episódio"**
2. O episódio é salvo no banco de dados
3. O Cloudinary Upload Widget abre automaticamente
4. O arquivo é enviado diretamente do browser para o Cloudinary (sem intermediários)
5. Ao concluir, o widget dispara um callback com o `public_id`
6. O frontend chama `POST /api/animes/{animeId}/episodes/{id}/video-confirm` com o `publicId`
7. O backend salva o `publicId` e marca o episódio como `READY`

Essa arquitetura evita que o Render receba arquivos grandes, eliminando riscos de OOM e timeouts por falta de memória.

## Streaming de vídeo

Os vídeos não são buscados diretamente do backend pelo browser. O player aponta seu `src` para `/api/stream/[episodeId]`, que é um Route Handler do Next.js responsável por:

1. Ler o JWT do cookie server-side
2. Encaminhar a requisição ao backend com o header `Authorization`
3. Repassar os headers `Range` para suporte a seek
4. Transmitir o corpo da resposta diretamente sem carregá-lo em memória

Isso mantém o JWT completamente fora do JavaScript do cliente e permite transmitir arquivos de qualquer tamanho sem sobrecarregar a memória do browser.

## Progresso de exibição

O hook `useWatchProgress` salva o progresso de reprodução no backend a cada 10 segundos. Quando o usuário navega para outra página ou fecha a aba, um salvamento final é enviado via `navigator.sendBeacon` para garantir que a requisição seja concluída mesmo durante o descarregamento da página.

O progresso só é salvo para usuários autenticados. A reprodução sem autenticação funciona normalmente, mas o progresso não é persistido.

## Painel administrativo

Acessível em `/admin`. Apenas usuários com o perfil `ADMIN` podem acessá-lo.

Funcionalidades:
- Dashboard com contagem de animes por status
- CRUD de animes com upload de capa e banner
- CRUD de episódios com upload de vídeo (via Cloudinary Upload Widget) e thumbnail
- Rastreamento de status do vídeo (Processando / Pronto / Erro)
- Estados de rascunho e publicado para episódios

## Deploy (Vercel)

1. Conecte o repositório a um projeto Vercel
2. Adicione as variáveis de ambiente em **Settings → Environment Variables**:
   - `API_URL` — URL do backend (ex: `https://seu-backend.onrender.com`)
   - `NEXT_PUBLIC_API_URL` — mesma URL, exposta ao browser para o Axios
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` — cloud name da conta Cloudinary
   - `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` — nome do upload preset unsigned criado no Cloudinary
3. Faça o deploy

O arquivo `proxy.ts` é reconhecido automaticamente pelo Next.js 16 como ponto de entrada do middleware de edge.

## Lint

```bash
npm run lint
```

O ESLint está configurado com `eslint-config-next/core-web-vitals` e `eslint-config-next/typescript`.