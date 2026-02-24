export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;

  if (!id || !/^MLB\d+$/i.test(id)) {
    return res.status(400).json({ error: 'ID invalido. Use formato MLB123456789' });
  }

  const itemId = id.toUpperCase();

  try {
    const itemRes = await fetch(`https://api.mercadolibre.com/items/${itemId}`);

    if (!itemRes.ok) {
      return res.status(itemRes.status).json({ error: 'Produto nao encontrado no ML' });
    }

    const item = await itemRes.json();

    let seller = {};
    try {
      const sellerRes = await fetch(`https://api.mercadolibre.com/users/${item.seller_id}`);
      seller = await sellerRes.json();
    } catch (e) {}

    const preco_promo    = item.price || 0;
    const preco_original = item.original_price || null;

    let desconto = null;
    if (preco_original && preco_original > preco_promo) {
      desconto = Math.round((1 - preco_promo / preco_original) * 100) + '%';
    }

    let parcelamento = null;
    if (item.installments) {
      const inst  = item.installments;
      const valor = inst.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      parcelamento = inst.quantity + 'x de R$ ' + valor + (inst.rate === 0 ? ' sem juros' : '');
    }

    return res.status(200).json({
      id:             item.id,
      titulo:         item.title,
      preco_promo:    preco_promo.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      preco_original: preco_original ? preco_original.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : null,
      desconto,
      parcelamento,
      loja:           seller.nickname || null,
      link:           item.permalink,
      thumbnail:      item.thumbnail || null,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno ao buscar produto' });
  }
}
