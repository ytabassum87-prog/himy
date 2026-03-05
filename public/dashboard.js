const categoryOrder = [
  "Starters & Appetizers",
  "Classic Pizzas",
  "Specialty Pizzas",
  "Spicy & Desi Flavors",
  "Stuffed Crust Options",
  "Sizes",
  "Sides",
  "Pasta",
  "Other Items",
  "Desserts",
  "Beverages",
  "Deals & Combos",
];

const sizeMultipliers = { Small: 1, Medium: 1.25, Large: 1.5, "Extra Large": 1.8 };
const crustAddons = {
  Regular: 0,
  "Cheese Stuffed Crust": 2.99,
  "Sausage Stuffed Crust": 3.49,
  "Cream Cheese Crust": 2.99,
  "Garlic Butter Crust": 1.99,
};
const pizzaCategories = new Set(["Classic Pizzas", "Specialty Pizzas", "Spicy & Desi Flavors"]);

let allMenu = [];
let activeItem = null;

const sectionsWrap = document.getElementById("menu-sections");
const modal = document.getElementById("item-modal");
const modalTitle = document.getElementById("modal-title");
const modalBase = document.getElementById("modal-base");
const modalSize = document.getElementById("modal-size");
const modalCrust = document.getElementById("modal-crust");
const modalQty = document.getElementById("modal-qty");
const modalTotal = document.getElementById("modal-total");

function slugify(value) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function artClass(category) {
  return `cat-${slugify(category || "menu-item")}`;
}

function categoryIconEntity(category) {
  const key = String(category || "").toLowerCase();
  if (key.includes("pizza")) return "&#x1F355;";
  if (key.includes("other")) return "&#x1F354;";
  if (key.includes("dessert")) return "&#x1F370;";
  if (key.includes("beverage")) return "&#x1F964;";
  if (key.includes("pasta")) return "&#x1F35D;";
  if (key.includes("starter")) return "&#x1F956;";
  if (key.includes("side")) return "&#x1F957;";
  if (key.includes("deal")) return "&#x1F389;";
  if (key.includes("stuffed crust")) return "&#x1F9C0;";
  if (key.includes("size")) return "&#x1F4CF;";
  return "&#x1F37D;";
}

function showLoading() {
  sectionsWrap.innerHTML = `<div class="center panel"><div class="spinner"></div></div>`;
}

function calcUnitPrice(item, size, crust) {
  let price = Number(item.price);
  if (pizzaCategories.has(item.category)) {
    price = price * (sizeMultipliers[size] || 1) + (crustAddons[crust] || 0);
  }
  return Number(price.toFixed(2));
}

function updateModalTotal() {
  if (!activeItem) return;
  const qty = Math.max(1, Number(modalQty.value) || 1);
  const unit = calcUnitPrice(activeItem, modalSize.value, modalCrust.value);
  modalTotal.textContent = `Total: ${window.Firestone.money(unit * qty)}`;
}

function openModal(item) {
  activeItem = item;
  modalTitle.textContent = item.name;
  modalBase.textContent = `Base Price: ${window.Firestone.money(item.price)}`;
  modalQty.value = "1";
  const isPizza = pizzaCategories.has(item.category);
  modalSize.disabled = !isPizza;
  modalCrust.disabled = !isPizza;
  if (!isPizza) {
    modalSize.value = "Small";
    modalCrust.value = "Regular";
  }
  updateModalTotal();
  modal.classList.add("show");
}

function addToCartFromModal() {
  if (!activeItem) return;
  const quantity = Math.max(1, Number(modalQty.value) || 1);
  const size = modalSize.disabled ? "Regular" : modalSize.value;
  const crust = modalCrust.disabled ? "Regular" : modalCrust.value;
  const unitPrice = calcUnitPrice(activeItem, size, crust);
  const key = `${activeItem.id}::${size}::${crust}`;

  const cart = window.Firestone.getCart();
  const existing = cart.find((c) => c.key === key);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      key,
      menu_id: activeItem.id,
      name: activeItem.name,
      category: activeItem.category,
      size,
      crust,
      quantity,
      unit_price: unitPrice,
      image: activeItem.image,
    });
  }

  window.Firestone.setCart(cart);
  window.Firestone.toast(`${activeItem.name} added to cart`);
  modal.classList.remove("show");
}

function renderMenu(items) {
  const grouped = {};
  items.forEach((item) => {
    grouped[item.category] = grouped[item.category] || [];
    grouped[item.category].push(item);
  });

  sectionsWrap.innerHTML = "";
  categoryOrder.forEach((category) => {
    const rows = grouped[category];
    if (!rows || !rows.length) return;

    const section = document.createElement("section");
    section.className = "section";
    section.id = slugify(category);
    section.innerHTML = `<h2>${category}</h2><div class="menu-grid"></div>`;
    const grid = section.querySelector(".menu-grid");

    rows.forEach((item) => {
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `
        <div class="generated-art ${artClass(item.category)}" aria-hidden="true">
          <img class="art-photo" src="${window.Firestone.unsplashVisual(item.name, item.category)}" alt="${item.name}" loading="lazy">
          <div class="art-overlay">
            <div class="gen-top">
              <span class="gen-cat">${item.category}</span>
              <span class="art-icon-box">${categoryIconEntity(item.category)}</span>
            </div>
            <span class="gen-name">${item.name}</span>
          </div>
        </div>
        <div class="card-body">
          <h3 class="card-title">${item.name}</h3>
          <p class="card-desc">${item.description || ""}</p>
          <div class="card-price">${window.Firestone.money(item.price)}</div>
          <div class="inline-row">
            <button class="btn btn-primary" data-add>Add to Cart</button>
            <a class="chip" href="/category/${slugify(category)}" style="padding:0.4rem 0.65rem;">View Page</a>
          </div>
        </div>
      `;
      card.querySelector("[data-add]").addEventListener("click", () => openModal(item));
      grid.appendChild(card);
    });

    sectionsWrap.appendChild(section);
  });
}

async function loadMenu() {
  showLoading();
  try {
    allMenu = await window.Firestone.api("/api/menu");
    renderMenu(allMenu);
  } catch (err) {
    sectionsWrap.innerHTML = `<div class="panel status error">${err.message}</div>`;
  }
}

document.getElementById("modal-add-btn").addEventListener("click", addToCartFromModal);
document.getElementById("modal-close-btn").addEventListener("click", () => modal.classList.remove("show"));
modalSize.addEventListener("change", updateModalTotal);
modalCrust.addEventListener("change", updateModalTotal);
modalQty.addEventListener("input", updateModalTotal);
document.getElementById("logout-btn").addEventListener("click", window.Firestone.logout);

if (window.Firestone.ensureAuthOrRedirect()) {
  loadMenu();
}
