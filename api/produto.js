module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  let { id, url } = req.query;

  if (url) {
    try {
      const redirectRes = await fetch(url, { method: 'GET', redirect: 'follow' });
      const finalUrl = redirectRes.url;
      const match = finalUrl.match(/wid=(MLB\d+)/i) ||
                    finalUrl.match(/\/(MLB\d+)(?:[#?-]|$)/i) ||
                    finalUrl.match(/-(MLB\d+)-/i) ||
                    finalUrl.match(/(MLB\d+)/i);
      if (match) {
        id = match[1].toUpperCase();
      } else {
        return res.status(400).json({ error: 'Nao consegui encontrar o produto nesse link' });
      }
    } catch (e) {
      return res.status(400).json({ error: 'Nao consegui resolver o link: ' + e.message });
    }
  }

  if (!id || !/^MLB\d+$/i.test(id)) {
    return res.status(400).json({ error: 'ID invalido' });
  }

  const itemId = id.toUpperCase();

  try {
    let item = null;
    const itemRes = await fetch(`https://api.mercadolibre.com/items/${itemId}`);

    if (itemRes.ok) {
      item = await itemRes.json();
    } else {
      const catalogRes = await fetch(`https://api.mercadolibre.com/products/${itemId}`);
      if (catalogRes.ok) {
        const catalog = await catalogRes.json();
        if (catalog.buy_box_winner) {
          const winnerRes = await fetch(`https://api.mercadolibre.com/items/${catalog.buy_box_winner.item_id}`);
          if (winnerRes.ok) item = await winnerRes.json();
        }
        if (!item) {
          return res.status(200).json({
            id: catalog.id, titulo: catalog.name,
            preco_promo: null, preco_original: null,
            desconto: null, parcelamento: null, loja: null, link: null,
            thumbnail: catalog.pictures?.[0]?.url || null,
          });
        }
      } else {
        return res.status(404).json({ error: 'Produto nao encontrado' });
      }
    }

    let seller = {};
    try {
      const sellerRes = await fetch(`https://api.mercadolibre.com/users/${item.seller_id}`);
      seller = await sellerRes.json();
    } catch (e) {}

    const preco_promo = item.price || 0;
    const preco_original = item.original_price || null;

    let desconto = null;
    if (preco_original && preco_original > preco_promo) {
      desconto = Math.round((1 - preco_promo / preco_original) * 100) + '%';
    }

    let parcelamento = null;
    if (item.installments) {
      const inst = item.installments;
      const valor = inst.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      parcelamento = inst.quantity + 'x de R$ ' + valor + (inst.rate === 0 ? ' sem juros' : '');
    }

    return res.status(200).json({
      id: item.id, titulo: item.title,
      preco_promo: preco_promo ? preco_promo.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : null,
      preco_original: preco_original ? preco_original.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : null,
      desconto, parcelamento,
      loja: seller.nickname || null,
      link: item.permalink,
      thumbnail: item.thumbnail || null,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno: ' + err.message });
  }
}
