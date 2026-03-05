const starPicker = document.getElementById("star-picker");
const ratingInput = document.getElementById("rating");
const listEl = document.getElementById("reviews-list");
const avgEl = document.getElementById("avg-rating");
const statusEl = document.getElementById("review-status");
const form = document.getElementById("review-form");

function setStatus(msg, isError = false) {
  statusEl.className = `status ${isError ? "error" : "ok"}`;
  statusEl.textContent = msg;
}

function renderStarsInput() {
  starPicker.innerHTML = "";
  for (let i = 1; i <= 5; i += 1) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-muted";
    btn.textContent = i <= Number(ratingInput.value) ? "★" : "☆";
    btn.style.padding = "0.4rem 0.55rem";
    btn.addEventListener("click", () => {
      ratingInput.value = String(i);
      renderStarsInput();
    });
    starPicker.appendChild(btn);
  }
}

function stars(value) {
  return "★".repeat(value) + "☆".repeat(5 - value);
}

async function loadReviews() {
  try {
    const data = await window.Firestone.api("/api/reviews");
    avgEl.textContent = `Average Rating: ${data.average}/5 (${data.total} reviews)`;
    if (!data.reviews.length) {
      listEl.innerHTML = "<p class='hint'>No reviews yet.</p>";
      return;
    }
    listEl.innerHTML = data.reviews
      .map(
        (review) => `
      <article class="panel" style="margin-bottom:0.7rem;">
        <div class="inline-row" style="justify-content:space-between;">
          <strong>${review.customer_name}</strong>
          <span>${stars(Number(review.rating))}</span>
        </div>
        <p>${review.comment}</p>
        <p class="hint">${new Date(review.created_at).toLocaleString()}</p>
      </article>`
      )
      .join("");
  } catch (err) {
    listEl.innerHTML = `<p class="status error">${err.message}</p>`;
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!window.Firestone.ensureAuthOrRedirect()) return;
  try {
    await window.Firestone.api("/api/reviews", {
      method: "POST",
      body: JSON.stringify({
        rating: Number(ratingInput.value),
        comment: document.getElementById("comment").value.trim(),
      }),
    });
    setStatus("Review submitted.");
    form.reset();
    ratingInput.value = "5";
    renderStarsInput();
    loadReviews();
  } catch (err) {
    setStatus(err.message, true);
  }
});

renderStarsInput();
loadReviews();
