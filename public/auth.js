const form = document.querySelector("form[data-auth-form]");
const statusEl = document.getElementById("auth-status");

function setStatus(message, isError = false) {
  statusEl.className = `status ${isError ? "error" : "ok"}`;
  statusEl.textContent = message;
}

if (window.Firestone.getToken()) {
  window.location.href = "/dashboard";
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const mode = form.dataset.authForm;

  try {
    if (mode === "login") {
      const payload = {
        email: form.email.value.trim(),
        password: form.password.value,
      };
      const data = await window.Firestone.api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      window.Firestone.setAuth(data);
      setStatus("Login successful. Redirecting...");
      setTimeout(() => (window.location.href = "/dashboard"), 450);
      return;
    }

    const payload = {
      full_name: form.full_name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      password: form.password.value,
      confirm_password: form.confirm_password.value,
      address: form.address.value.trim(),
      agree_terms: !!form.agree_terms.checked,
    };
    await window.Firestone.api("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const loginData = await window.Firestone.api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: payload.email, password: payload.password }),
    });
    window.Firestone.setAuth(loginData);
    setStatus("Account created. Redirecting to dashboard...");
    setTimeout(() => (window.location.href = "/dashboard"), 500);
  } catch (err) {
    setStatus(err.message, true);
  }
});
