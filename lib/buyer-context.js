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
  if (!store) return;
  try {
    localStorage.setItem(
      `orderflow-cart:${store}`,
      JSON.stringify(cart)
    );
    window.dispatchEvent(new Event('orderflow-cart-change'));
  } catch {}
}

export function readAllCarts() {
  try {
    return Object.keys(localStorage)
      .filter(key => /^orderflow-cart:[0-9a-f-]{36}$/i.test(key))
      .map(key => {
        const store = key.slice('orderflow-cart:'.length);
        return { store, business: localStorage.getItem(`orderflow-store-name:${store}`) || 'Your store', cart: readCart(store) };
      }).filter(group => group.cart.length);
  } catch { return []; }
}

export function rememberStore(store, business) {
  try { localStorage.setItem(`orderflow-store-name:${store}`, business); } catch {}
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
