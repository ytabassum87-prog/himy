const contentEl = document.getElementById("about-content");
const phoneEl = document.getElementById("about-phone");
const ownerEl = document.getElementById("about-owner");
const updatedEl = document.getElementById("about-updated");
const adminPanel = document.getElementById("admin-about-panel");
const form = document.getElementById("about-form");
const statusEl = document.getElementById("about-status");

function setStatus(msg, isError = false) {
  statusEl.className = `status ${isError ? "error" : "ok"}`;
  statusEl.textContent = msg;
}

async function loadAbout() {
  try {
    const data = await window.Firestone.api("/api/about");
    contentEl.textContent = data.content;
    phoneEl.textContent = `Phone: ${data.phone}`;
    ownerEl.textContent = `Owner: ${data.owner_name}`;
    updatedEl.textContent = `Last updated: ${new Date(data.updated_at).toLocaleString()}`;

    if (form) {
      form.content.value = data.content;
      form.phone.value = data.phone;
      form.owner_name.value = data.owner_name;
    }
  } catch (err) {
    contentEl.textContent = err.message;
  }
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await window.Firestone.api("/api/admin/about", {
      method: "PUT",
      body: JSON.stringify({
        content: form.content.value.trim(),
        phone: form.phone.value.trim(),
        owner_name: form.owner_name.value.trim(),
      }),
    });
    setStatus("About section updated.");
    loadAbout();
  } catch (err) {
    setStatus(err.message, true);
  }
});

const user = window.Firestone.getUser();
if (user?.role === "admin") {
  adminPanel.style.display = "block";
}

loadAbout();
