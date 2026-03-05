window.Firestone = (() => {
  const AUTH_KEY = "firestone_auth_v1";
  const CART_KEY = "firestone_cart_v1";

  function getAuth() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
    } catch {
      return null;
    }
  }

  function setAuth(payload) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(payload));
  }

  function clearAuth() {
    localStorage.removeItem(AUTH_KEY);
  }

  function getToken() {
    return getAuth()?.token || "";
  }

  function getUser() {
    return getAuth()?.user || null;
  }

  function ensureAuthOrRedirect() {
    if (!getToken()) {
      window.location.href = "/login";
      return false;
    }
    return true;
  }

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function setCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    updateCartBadges();
  }

  function clearCart() {
    localStorage.removeItem(CART_KEY);
    updateCartBadges();
  }

  function cartCount() {
    return getCart().reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }

  function money(value) {
    return `$${Number(value || 0).toFixed(2)}`;
  }

  function generatedImage(name, category) {
    const key = String(category || "item").toLowerCase();
    let a = "#5d3a23";
    let b = "#2a1a13";
    let c = "#dbb272";
    if (key.includes("pizza")) {
      a = "#7a3f1f";
      b = "#3a1e12";
      c = "#f0bd72";
    } else if (key.includes("dessert")) {
      a = "#6d3a2e";
      b = "#2e1a16";
      c = "#efc18b";
    } else if (key.includes("beverage")) {
      a = "#2f4f5f";
      b = "#162833";
      c = "#9ed1db";
    } else if (key.includes("pasta")) {
      a = "#7b5a2a";
      b = "#3c2b16";
      c = "#f1cf85";
    } else if (key.includes("other")) {
      a = "#5c3420";
      b = "#27170f";
      c = "#efb989";
    }

    const safeName = String(name || "Menu Item").replace(/[<>&'"]/g, "");
    const safeCat = String(category || "Firestone").replace(/[<>&'"]/g, "");
    const svg = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'>
  <defs>
    <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0%' stop-color='${a}'/>
      <stop offset='100%' stop-color='${b}'/>
    </linearGradient>
  </defs>
  <rect width='800' height='600' fill='url(#g)'/>
  <circle cx='120' cy='120' r='90' fill='${c}' opacity='0.18'/>
  <circle cx='690' cy='520' r='120' fill='${c}' opacity='0.15'/>
  <rect x='70' y='120' width='660' height='360' rx='26' fill='rgba(0,0,0,0.18)' stroke='${c}' stroke-opacity='0.45'/>
  <text x='400' y='240' fill='${c}' text-anchor='middle' font-size='28' font-family='Segoe UI, Arial, sans-serif' letter-spacing='2'>FIRESTONE PIZZERIA</text>
  <text x='400' y='305' fill='white' text-anchor='middle' font-size='44' font-weight='700' font-family='Segoe UI, Arial, sans-serif'>${safeName}</text>
  <text x='400' y='352' fill='#f3e4cd' text-anchor='middle' font-size='24' font-family='Segoe UI, Arial, sans-serif'>${safeCat}</text>
</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  function unsplashVisual(name, category) {
    const itemKey = String(name || "").toLowerCase();
    const catKey = String(category || "").toLowerCase();

    const itemMap = {
      margherita: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=80",
      pepperoni: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=1200&q=80",
      "bbq chicken": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
      "veggie supreme": "https://images.unsplash.com/photo-1511689660979-10d2b1aada49?auto=format&fit=crop&w=1200&q=80",
      "cheese lovers": "https://images.unsplash.com/photo-1565299507177-b0ac66763828?auto=format&fit=crop&w=1200&q=80",
      "supreme deluxe": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80",
      "meat feast": "https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=1200&q=80",
      "tandoori chicken pizza": "https://images.unsplash.com/photo-1601924582970-9238bcb495d9?auto=format&fit=crop&w=1200&q=80",
      "fajita pizza": "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=1200&q=80",
      hawaiian: "https://images.unsplash.com/photo-1548365328-5c7f6b7d8f12?auto=format&fit=crop&w=1200&q=80",
      "four cheese": "https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=1200&q=80",
      "malai boti pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80&sat=15",
      "seekh kebab pizza": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80&sat=20",
      "chapli kebab pizza": "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=1200&q=80",
      "achari chicken pizza": "https://images.unsplash.com/photo-1601924582970-9238bcb495d9?auto=format&fit=crop&w=1200&q=80&sat=25",
      "peri peri chicken pizza": "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=1200&q=80",
      "beef burger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80",
      "zinger burger": "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80",
      "chicken burger": "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=1200&q=80",
      "chicken shawarma": "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=1200&q=80",
      "panini sandwiches": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80",
      tiramisu: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=1200&q=80",
      "chocolate lava cake": "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&w=1200&q=80",
      "mint margarita": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80",
      "garlic bread classic": "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?auto=format&fit=crop&w=1200&q=80",
      "chicken wings (bbq / hot / garlic parmesan)":
        "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=1200&q=80",
      "loaded nachos": "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=1200&q=80",
      "fresh garden salad": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
      "chicken alfredo pasta": "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=1200&q=80",
    };

    for (const [key, url] of Object.entries(itemMap)) {
      if (itemKey.includes(key)) return url;
    }

    const categoryMap = [
      ["classic pizzas", "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=80"],
      ["specialty pizzas", "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80"],
      ["spicy & desi flavors", "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80"],
      ["starters & appetizers", "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?auto=format&fit=crop&w=1200&q=80"],
      ["stuffed crust options", "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80"],
      ["sides", "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80"],
      ["pasta", "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=1200&q=80"],
      ["other items", "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80"],
      ["desserts", "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=1200&q=80"],
      ["beverages", "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80"],
      ["deals & combos", "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80"],
      ["sizes", "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80"],
    ];

    for (const [key, url] of categoryMap) {
      if (catKey.includes(key)) return url;
    }

    return "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80";
  }

  function toast(message) {
    let wrap = document.querySelector(".toast-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "toast-wrap";
      document.body.appendChild(wrap);
    }
    const toastEl = document.createElement("div");
    toastEl.className = "toast";
    toastEl.textContent = message;
    wrap.appendChild(toastEl);
    setTimeout(() => toastEl.remove(), 2800);
  }

  function setProfileInitials() {
    const user = getUser();
    const initials = user?.full_name
      ? user.full_name
          .split(" ")
          .slice(0, 2)
          .map((p) => p[0]?.toUpperCase() || "")
          .join("")
      : "?";
    document.querySelectorAll("[data-profile-initials]").forEach((el) => {
      el.textContent = initials;
      el.title = user?.full_name || "Guest";
    });
  }

  function updateCartBadges() {
    const count = cartCount();
    document.querySelectorAll("[data-cart-count]").forEach((el) => {
      el.textContent = String(count);
    });
  }

  async function api(path, options = {}) {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(path, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Request failed.");
    }
    return data;
  }

  async function logout() {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    clearAuth();
    window.location.href = "/login";
  }

  return {
    getAuth,
    setAuth,
    clearAuth,
    getToken,
    getUser,
    ensureAuthOrRedirect,
    getCart,
    setCart,
    clearCart,
    cartCount,
    money,
    toast,
    updateCartBadges,
    setProfileInitials,
    generatedImage,
    unsplashVisual,
    api,
    logout,
  };
})();

window.addEventListener("DOMContentLoaded", () => {
  window.Firestone.updateCartBadges();
  window.Firestone.setProfileInitials();
});
