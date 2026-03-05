const profileUserEl = document.getElementById("profile-user");
const profileStatsEl = document.getElementById("profile-stats");
const profileFavoritesEl = document.getElementById("profile-favorites");
const profileHistoryEl = document.getElementById("profile-history");

const profileForm = document.getElementById("profile-form");
const passwordForm = document.getElementById("password-form");

const profileFormStatusEl = document.getElementById("profile-form-status");
const passwordFormStatusEl = document.getElementById("password-form-status");

function setStatus(target, message, isError = false) {
  target.className = `status ${isError ? "error" : "ok"}`;
  target.textContent = message;
}

function dateText(value) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
}

async function loadOrderHistory() {
  try {
    const history = await window.Firestone.api("/api/orders/history");
    if (!history.length) {
      profileHistoryEl.innerHTML = "<p>No orders yet.</p>";
      return;
    }
    profileHistoryEl.innerHTML = `
      <table class="table">
        <thead>
          <tr><th>Order</th><th>Status</th><th>Total</th><th>Date</th></tr>
        </thead>
        <tbody>
          ${history
            .map(
              (row) =>
                `<tr><td>#${row.id}</td><td>${row.status}</td><td>${window.Firestone.money(row.total)}</td><td>${dateText(
                  row.created_at
                )}</td></tr>`
            )
            .join("")}
        </tbody>
      </table>
    `;
  } catch (err) {
    profileHistoryEl.textContent = err.message;
  }
}

async function loadProfileSummary() {
  try {
    const data = await window.Firestone.api("/api/profile/summary");
    const user = data.user || {};
    const stats = data.stats || {};
    const favorites = Array.isArray(data.favorites) ? data.favorites : [];

    profileUserEl.innerHTML = `
      <p><strong>Name:</strong> ${user.full_name || "-"}</p>
      <p><strong>Email:</strong> ${user.email || "-"}</p>
      <p><strong>Phone:</strong> ${user.phone || "-"}</p>
      <p><strong>Address:</strong> ${user.address || "-"}</p>
      <p><strong>Role:</strong> ${user.role || "-"}</p>
    `;

    profileStatsEl.innerHTML = `
      <p><strong>Total Orders:</strong> ${stats.total_orders || 0}</p>
      <p><strong>Total Spend:</strong> ${window.Firestone.money(stats.total_spend || 0)}</p>
      <p><strong>Member Since:</strong> ${dateText(stats.member_since)}</p>
      <p><strong>Last Order:</strong> ${
        stats.last_order
          ? `#${stats.last_order.id} - ${stats.last_order.status} (${dateText(stats.last_order.created_at)})`
          : "No orders yet"
      }</p>
    `;

    if (!favorites.length) {
      profileFavoritesEl.innerHTML = "<p>No favorites yet.</p>";
    } else {
      profileFavoritesEl.innerHTML = `
        <table class="table">
          <thead>
            <tr><th>Item</th><th>Times Ordered</th></tr>
          </thead>
          <tbody>
            ${favorites.map((item) => `<tr><td>${item.name}</td><td>${item.qty}</td></tr>`).join("")}
          </tbody>
        </table>
      `;
    }

    profileForm.full_name.value = user.full_name || "";
    profileForm.email.value = user.email || "";
    profileForm.phone.value = user.phone || "";
    profileForm.address.value = user.address || "";
  } catch (err) {
    profileUserEl.textContent = err.message;
    profileStatsEl.textContent = err.message;
    profileFavoritesEl.textContent = err.message;
  }
}

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const payload = {
      full_name: profileForm.full_name.value.trim(),
      email: profileForm.email.value.trim(),
      phone: profileForm.phone.value.trim(),
      address: profileForm.address.value.trim(),
    };
    const data = await window.Firestone.api("/api/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    const auth = window.Firestone.getAuth();
    if (auth?.user && data.user) {
      auth.user = data.user;
      window.Firestone.setAuth(auth);
      window.Firestone.setProfileInitials();
    }

    setStatus(profileFormStatusEl, "Profile updated.");
    await loadProfileSummary();
  } catch (err) {
    setStatus(profileFormStatusEl, err.message, true);
  }
});

passwordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await window.Firestone.api("/api/profile/password", {
      method: "PUT",
      body: JSON.stringify({
        current_password: passwordForm.current_password.value,
        new_password: passwordForm.new_password.value,
        confirm_password: passwordForm.confirm_password.value,
      }),
    });
    passwordForm.reset();
    setStatus(passwordFormStatusEl, "Password updated successfully.");
  } catch (err) {
    setStatus(passwordFormStatusEl, err.message, true);
  }
});

if (window.Firestone.ensureAuthOrRedirect()) {
  loadProfileSummary();
  loadOrderHistory();
}
