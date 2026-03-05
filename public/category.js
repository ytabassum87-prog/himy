const titleEl = document.getElementById("category-title");
const subtitleEl = document.getElementById("category-subtitle");
const gridEl = document.getElementById("category-grid");

function toTitleCase(value) {
  return value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase())
    .replace(/\bAnd\b/g, "&");
}

function currentSlug() {
  const parts = location.pathname.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

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

async function loadCategory() {
  const slug = currentSlug();
  titleEl.textContent = toTitleCase(slug);
  subtitleEl.textContent = "Loading products...";
  try {
    const rows = await window.Firestone.api("/api/menu");
    const filtered = rows.filter((item) => slugify(item.category) === slug);
    subtitleEl.textContent = `${filtered.length} products found`;
    if (!filtered.length) {
      gridEl.innerHTML = "<p class='hint'>No products in this category.</p>";
      return;
    }
    gridEl.innerHTML = filtered
      .map(
        (item) => `
      <article class="card">
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
        </div>
      </article>`
      )
      .join("");
  } catch (err) {
    subtitleEl.textContent = err.message;
  }
}

loadCategory();
