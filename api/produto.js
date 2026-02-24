// api/produto.js — Vercel Serverless Function
// Proxy para a API do Mercado Livre, resolvendo o problema de CORS

export default async function handler(req, res) {
  // Permite qualquer origem (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;

  if (!id || !/^MLB\d+$/i.test(id)) {
    return res.status(400).json({ error: 'ID inválido. Use formato MLB123456789' });
  }

  const itemId = id.toUpperCase();

  try {
    // Busca dados do item e do vendedor em paralelo
    const [itemRes, userRes] = await Promise.all([
      fetch(`https://api.mercadolibre.com/items/${itemId}`),
      fetch(`https://api.mercadolibre.com/items/${itemId}`).then(r => r.json()).then(item =>
        fetch(`https://api.mercadolibre.com/users/${item.seller_id}`)
      )
    ]);

    if (!itemRes.ok) {
      return res.status(itemRes.status).json({ error: 'Produto não encontrado no ML' });
    }

    const item = await itemRes.json();
    const seller = await userRes.json();

    // Monta resposta limpa
    const preco_promo = item.price || 0;
    const preco_original = item.original_price || null;

    let desconto = null;
    if (preco_original && preco_original > preco_promo) {
      desconto = Math.round((1 - preco_promo / preco_original) * 100);
    }

    let parcelamento = null;
    if (item.installments) {
      const inst = item.installments;
      const valor = inst.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      parcelamento = `${inst.quantity}x de R$ ${valor}${inst.rate === 0 ? ' sem juros' : ''}`;
    }

    return res.status(200).json({
      id: item.id,
      titulo: item.title,
      preco_promo: preco_promo.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      preco_original: preco_original
        ? preco_original.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
        : null,
      desconto: desconto ? `${desconto}%` : null,
      parcelamento,
      loja: seller.nickname || null,
      link: item.permalink,
      thumbnail: item.thumbnail,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno ao buscar produto' });
  }
}
