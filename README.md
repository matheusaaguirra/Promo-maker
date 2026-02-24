# 🔥 Promo Maker ML

Gerador de posts de promoção do Mercado Livre para WhatsApp.

## Como fazer deploy no Vercel

### Opção 1 — Pelo site (mais fácil, sem precisar de Git)

1. Acesse [vercel.com](https://vercel.com) e crie uma conta grátis
2. No dashboard, clique em **"Add New → Project"**
3. Clique em **"Upload"** (ou arraste a pasta do projeto)
4. Selecione a pasta `promo-maker` inteira
5. Clique em **Deploy** — pronto! ✅

### Opção 2 — Pelo terminal com Vercel CLI

```bash
# Instala o CLI do Vercel
npm install -g vercel

# Dentro da pasta do projeto
cd promo-maker
vercel

# Siga as instruções, aceite os padrões e pronto!
```

## Estrutura do projeto

```
promo-maker/
├── api/
│   └── produto.js      ← Backend (lê a API do ML sem CORS)
├── public/
│   └── index.html      ← Frontend
├── vercel.json         ← Configuração do Vercel
└── package.json
```

## Como funciona

- O botão 🤖 chama `/api/produto?id=MLB123456`
- O backend em Node.js consulta a API pública do ML sem CORS
- Os campos são preenchidos automaticamente
- O botão WhatsApp gera um link `wa.me` com a mensagem formatada
