export function readCart(store) {
  try {
    const rows = JSON.parse(
      localStorage.getItem(`orderflow-cart:${store}`) || '[]'
    );

    return Array.isArray(rows)
      ? rows.filter(
          row =>
            row?.product?.id &&
            Number.isInteger(row.quantity) &&
            row.quantity > 0
        )
      : [];
  } catch {
    return [];
  }
}

export function writeCart(store, cart) {
  try {
    localStorage.setItem(
      `orderflow-cart:${store}`,
      JSON.stringify(cart)
    );
  } catch {}
}

export function buyerLink(
  store,
  business,
  cart,
  signup = false,
  token = ''
) {
  writeCart(store, cart);

  try {
    localStorage.setItem('orderflow-buyer-store', store);
    localStorage.setItem(
      `orderflow-store-name:${store}`,
      business
    );

    if (token) {
      sessionStorage.setItem('orderflow-save-order', token);
    }
  } catch {}

  return `/buyer?store=${encodeURIComponent(store)}${
    signup ? '&mode=signup' : ''
  }`;
}
