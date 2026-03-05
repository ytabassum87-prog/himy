const cartWrap = document.getElementById("cart-wrap");
const orderStatus = document.getElementById("order-status");
const historyWrap = document.getElementById("history-wrap");
const liveWrap = document.getElementById("live-order");

function setStatus(msg, isError = false) {
  orderStatus.className = `status ${isError ? "error" : "ok"}`;
  orderStatus.textContent = msg;
}

function calcCartTotal(cart) {
  return cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
}

function renderCart() {
  const cart = window.Firestone.getCart();
  if (!cart.length) {
    cartWrap.innerHTML = "<p class='hint'>Your cart is empty.</p>";
    return;
  }

  const rows = cart
    .map(
      (item) => `
    <tr>
      <td>${item.name}</td>
      <td>${item.size}</td>
      <td>${item.crust}</td>
      <td>${item.quantity}</td>
      <td>${window.Firestone.money(item.unit_price * item.quantity)}</td>
    </tr>`
    )
    .join("");

  cartWrap.innerHTML = `
    <table class="table">
      <thead>
        <tr><th>Item</th><th>Size</th><th>Crust</th><th>Qty</th><th>Total</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="card-price">Grand Total: ${window.Firestone.money(calcCartTotal(cart))}</p>
  `;
}

async function placeOrder() {
  const cart = window.Firestone.getCart();
  if (!cart.length) {
    setStatus("Add items before placing order.", true);
    return;
  }
  try {
    const payload = {
      items: cart.map((item) => ({
        menu_id: item.menu_id,
        quantity: item.quantity,
        size: item.size,
        crust: item.crust,
      })),
    };
    const data = await window.Firestone.api("/api/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setStatus(`Order #${data.order_id} placed successfully.`);
    window.Firestone.toast("Order placed successfully");
    window.Firestone.clearCart();
    renderCart();
    loadCurrentOrder();
    loadHistory();
  } catch (err) {
    setStatus(err.message, true);
  }
}

async function cancelLatestOrder() {
  try {
    const data = await window.Firestone.api("/api/orders/current");
    if (!data.order) {
      setStatus("No active order to cancel.", true);
      return;
    }
    await window.Firestone.api(`/api/orders/${data.order.id}/cancel`, { method: "POST" });
    setStatus("Latest order cancelled.");
    loadCurrentOrder();
    loadHistory();
  } catch (err) {
    setStatus(err.message, true);
  }
}

async function loadCurrentOrder() {
  try {
    const data = await window.Firestone.api("/api/orders/current");
    if (!data.order) {
      liveWrap.innerHTML = "<p class='hint'>No order has been placed yet.</p>";
      return;
    }
    liveWrap.innerHTML = `
      <p><strong>Order #${data.order.id}</strong></p>
      <p>Status: <strong>${data.order.status}</strong></p>
      <p>Total: ${window.Firestone.money(data.order.total)}</p>
      <p class="hint">Updated: ${new Date(data.order.updated_at).toLocaleString()}</p>
    `;
  } catch (err) {
    liveWrap.innerHTML = `<p class="status error">${err.message}</p>`;
  }
}

async function loadHistory() {
  try {
    const rows = await window.Firestone.api("/api/orders/history");
    if (!rows.length) {
      historyWrap.innerHTML = "<p class='hint'>No order history found.</p>";
      return;
    }
    historyWrap.innerHTML = `
      <table class="table">
        <thead><tr><th>Order</th><th>Status</th><th>Total</th><th>Date</th></tr></thead>
        <tbody>
          ${rows
            .map(
              (row) =>
                `<tr><td>#${row.id}</td><td>${row.status}</td><td>${window.Firestone.money(row.total)}</td><td>${new Date(
                  row.created_at
                ).toLocaleString()}</td></tr>`
            )
            .join("")}
        </tbody>
      </table>
    `;
  } catch (err) {
    historyWrap.innerHTML = `<p class="status error">${err.message}</p>`;
  }
}

document.getElementById("place-order-btn").addEventListener("click", placeOrder);
document.getElementById("cancel-order-btn").addEventListener("click", cancelLatestOrder);
document.getElementById("clear-cart-btn").addEventListener("click", () => {
  window.Firestone.clearCart();
  renderCart();
  setStatus("Cart cleared.");
});

if (window.Firestone.ensureAuthOrRedirect()) {
  renderCart();
  loadCurrentOrder();
  loadHistory();
  setInterval(loadCurrentOrder, 10000);
}
