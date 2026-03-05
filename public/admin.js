const analyticsWrap = document.getElementById("analytics-wrap");
const ordersWrap = document.getElementById("orders-wrap");
const menuEditorWrap = document.getElementById("menu-editor-wrap");
const statusEl = document.getElementById("admin-status");

function setStatus(msg, isError = false) {
  statusEl.className = `status ${isError ? "error" : "ok"}`;
  statusEl.textContent = msg;
}

async function loadAnalytics() {
  const data = await window.Firestone.api("/api/admin/analytics");
  analyticsWrap.innerHTML = `
    <p>Total Orders: <strong>${data.total_orders}</strong></p>
    <p>Revenue: <strong>${window.Firestone.money(data.revenue)}</strong></p>
    <p>Average Order: <strong>${window.Firestone.money(data.avg_order)}</strong></p>
    <p>Average Rating: <strong>${data.avg_rating}</strong> (${data.total_reviews} reviews)</p>
    <p class="hint">${data.statuses.map((s) => `${s.status}: ${s.count}`).join(" | ")}</p>
  `;
}

async function loadOrders() {
  const rows = await window.Firestone.api("/api/admin/orders");
  if (!rows.length) {
    ordersWrap.innerHTML = "<p class='hint'>No orders yet.</p>";
    return;
  }
  ordersWrap.innerHTML = `
    <table class="table">
      <thead><tr><th>Order</th><th>Customer</th><th>Phone</th><th>Total</th><th>Status</th><th>Update</th></tr></thead>
      <tbody>
      ${rows
        .map(
          (row) => `<tr>
          <td>#${row.id}</td>
          <td>${row.full_name}</td>
          <td>${row.phone}</td>
          <td>${window.Firestone.money(row.total)}</td>
          <td>${row.status}</td>
          <td>
            <select data-status="${row.id}">
              <option ${row.status === "Preparing" ? "selected" : ""}>Preparing</option>
              <option ${row.status === "Baking" ? "selected" : ""}>Baking</option>
              <option ${row.status === "Out for Delivery" ? "selected" : ""}>Out for Delivery</option>
              <option ${row.status === "Delivered" ? "selected" : ""}>Delivered</option>
              <option ${row.status === "Cancelled" ? "selected" : ""}>Cancelled</option>
            </select>
            <button class="btn btn-muted" data-save-status="${row.id}" type="button">Save</button>
          </td>
        </tr>`
        )
        .join("")}
      </tbody>
    </table>
  `;

  ordersWrap.querySelectorAll("[data-save-status]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-save-status");
      const select = ordersWrap.querySelector(`[data-status="${id}"]`);
      try {
        await window.Firestone.api(`/api/admin/orders/${id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: select.value }),
        });
        setStatus(`Order #${id} status updated.`);
        loadOrders();
      } catch (err) {
        setStatus(err.message, true);
      }
    });
  });
}

async function loadMenuEditor() {
  const items = await window.Firestone.api("/api/menu");
  const first20 = items.slice(0, 20);
  menuEditorWrap.innerHTML = `
    <table class="table">
      <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Save</th></tr></thead>
      <tbody>
        ${first20
          .map(
            (item) => `<tr>
              <td>${item.name}</td>
              <td>${item.category}</td>
              <td><input data-price="${item.id}" type="number" step="0.01" value="${item.price}" /></td>
              <td><button type="button" class="btn btn-muted" data-save-item="${item.id}">Update</button></td>
            </tr>`
          )
          .join("")}
      </tbody>
    </table>
    <p class="hint">Showing first 20 items for quick edit. Extend this table as needed.</p>
  `;

  menuEditorWrap.querySelectorAll("[data-save-item]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-save-item");
      const item = items.find((x) => String(x.id) === String(id));
      const price = Number(menuEditorWrap.querySelector(`[data-price="${id}"]`).value);
      try {
        await window.Firestone.api(`/api/admin/menu/${id}`, {
          method: "PUT",
          body: JSON.stringify({ ...item, price }),
        });
        setStatus(`Menu item "${item.name}" updated.`);
      } catch (err) {
        setStatus(err.message, true);
      }
    });
  });
}

const user = window.Firestone.getUser();
if (!user || user.role !== "admin") {
  window.location.href = "/dashboard";
} else {
  Promise.all([loadAnalytics(), loadOrders(), loadMenuEditor()]).catch((err) => {
    setStatus(err.message, true);
  });
}
