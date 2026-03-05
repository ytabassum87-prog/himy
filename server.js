const express = require("express");
const path = require("path");
const crypto = require("crypto");
const dbModule = require("./database");

const db = dbModule;
const { hashPassword } = dbModule;

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

const sessions = new Map();

const sizeMultipliers = {
  Small: 1,
  Medium: 1.25,
  Large: 1.5,
  "Extra Large": 1.8,
};

const crustAddons = {
  Regular: 0,
  "Cheese Stuffed Crust": 2.99,
  "Sausage Stuffed Crust": 3.49,
  "Cream Cheese Crust": 2.99,
  "Garlic Butter Crust": 1.99,
};

const pizzaCategories = new Set([
  "Classic Pizzas",
  "Specialty Pizzas",
  "Spicy & Desi Flavors",
]);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function sanitizeUser(user) {
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    address: user.address,
    role: user.role,
  };
}

function syncSessionsForUser(user) {
  const cleanUser = sanitizeUser(user);
  for (const [token, sessionUser] of sessions.entries()) {
    if (sessionUser?.id === cleanUser.id) {
      sessions.set(token, cleanUser);
    }
  }
}

function authRequired(req, res, next) {
  const token = String(req.headers.authorization || "").replace("Bearer ", "");
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.user = sessions.get(token);
  next();
}

function adminRequired(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

function isPizzaItem(category) {
  return pizzaCategories.has(category);
}

function toSlug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "firestone-pizzeria" });
});

app.post("/api/auth/signup", async (req, res) => {
  const fullName = String(req.body.full_name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const phone = String(req.body.phone || "").trim();
  const password = String(req.body.password || "");
  const confirmPassword = String(req.body.confirm_password || "");
  const address = String(req.body.address || "").trim();
  const agreeTerms = Boolean(req.body.agree_terms);

  if (!fullName || !email || !phone || !password || !confirmPassword || !address) {
    return res.status(400).json({ error: "All fields are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Password and confirm password do not match." });
  }
  if (!agreeTerms) {
    return res.status(400).json({ error: "You must agree to terms." });
  }

  try {
    const existing = await dbGet("SELECT id FROM users WHERE email = ?", [email]);
    if (existing) {
      return res.status(409).json({ error: "Email already registered." });
    }
    const passwordHash = hashPassword(password);
    await dbRun(
      "INSERT INTO users (full_name, email, phone, password_hash, address, role) VALUES (?, ?, ?, ?, ?, 'customer')",
      [fullName, email, phone, passwordHash, address]
    );
    return res.status(201).json({ message: "Account created successfully." });
  } catch (err) {
    return res.status(500).json({ error: "Could not create account." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const user = await dbGet("SELECT * FROM users WHERE email = ?", [email]);
    if (!user || user.password_hash !== hashPassword(password)) {
      return res.status(401).json({ error: "Invalid credentials." });
    }
    const token = crypto.randomBytes(24).toString("hex");
    const cleanUser = sanitizeUser(user);
    sessions.set(token, cleanUser);
    return res.json({ token, user: cleanUser });
  } catch (err) {
    return res.status(500).json({ error: "Could not login." });
  }
});

app.get("/api/auth/me", authRequired, (req, res) => {
  res.json(req.user);
});

app.post("/api/auth/logout", authRequired, (req, res) => {
  const token = String(req.headers.authorization || "").replace("Bearer ", "");
  sessions.delete(token);
  res.json({ message: "Logged out." });
});

app.get("/api/menu", async (_req, res) => {
  try {
    const rows = await dbAll(
      "SELECT id, name, description, price, category, image, is_popular FROM menu ORDER BY category, name"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch menu." });
  }
});

app.get("/api/categories", async (_req, res) => {
  try {
    const rows = await dbAll("SELECT DISTINCT category FROM menu ORDER BY category");
    res.json(rows.map((row) => ({ name: row.category, slug: toSlug(row.category) })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch categories." });
  }
});

app.post("/api/orders", authRequired, async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (!items.length) {
    return res.status(400).json({ error: "Cart is empty." });
  }

  try {
    const menuRows = await dbAll("SELECT id, name, price, category FROM menu");
    const menuMap = new Map(menuRows.map((row) => [row.id, row]));

    const validatedItems = [];
    let total = 0;

    for (const item of items) {
      const menuId = Number(item.menu_id);
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const size = String(item.size || "Small");
      const crust = String(item.crust || "Regular");

      if (!menuMap.has(menuId)) {
        return res.status(400).json({ error: "Invalid menu item in cart." });
      }

      const menuItem = menuMap.get(menuId);
      let unitPrice = Number(menuItem.price) || 0;

      if (isPizzaItem(menuItem.category)) {
        const sizeMultiplier = sizeMultipliers[size] || 1;
        const crustAddon = crustAddons[crust] || 0;
        unitPrice = Number((unitPrice * sizeMultiplier + crustAddon).toFixed(2));
      } else {
        unitPrice = Number(unitPrice.toFixed(2));
      }

      const lineTotal = Number((unitPrice * quantity).toFixed(2));
      total += lineTotal;

      validatedItems.push({
        menu_id: menuItem.id,
        name: menuItem.name,
        size: isPizzaItem(menuItem.category) ? size : "Regular",
        crust: isPizzaItem(menuItem.category) ? crust : "Regular",
        quantity,
        unit_price: unitPrice,
        line_total: lineTotal,
      });
    }

    total = Number(total.toFixed(2));
    const order = await dbRun(
      "INSERT INTO customer_orders (user_id, total, status) VALUES (?, ?, 'Preparing')",
      [req.user.id, total]
    );

    for (const item of validatedItems) {
      await dbRun(
        `INSERT INTO order_items (order_id, menu_id, name, size, crust, quantity, unit_price, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [order.id, item.menu_id, item.name, item.size, item.crust, item.quantity, item.unit_price, item.line_total]
      );
    }

    res.status(201).json({
      message: "Order placed successfully.",
      order_id: order.id,
      total,
      status: "Preparing",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to place order." });
  }
});

app.get("/api/orders/current", authRequired, async (req, res) => {
  try {
    const order = await dbGet(
      "SELECT * FROM customer_orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
      [req.user.id]
    );
    if (!order) {
      return res.json({ order: null, items: [] });
    }
    const items = await dbAll(
      "SELECT id, menu_id, name, size, crust, quantity, unit_price, line_total FROM order_items WHERE order_id = ?",
      [order.id]
    );
    res.json({ order, items });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch current order." });
  }
});

app.get("/api/orders/history", authRequired, async (req, res) => {
  try {
    const orders = await dbAll(
      "SELECT id, total, status, created_at, updated_at FROM customer_orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
      [req.user.id]
    );
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch order history." });
  }
});

app.post("/api/orders/:id/cancel", authRequired, async (req, res) => {
  const orderId = Number(req.params.id);
  try {
    const order = await dbGet("SELECT * FROM customer_orders WHERE id = ? AND user_id = ?", [orderId, req.user.id]);
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }
    if (order.status === "Delivered") {
      return res.status(400).json({ error: "Delivered order cannot be cancelled." });
    }
    await dbRun(
      "UPDATE customer_orders SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [orderId]
    );
    res.json({ message: "Order cancelled." });
  } catch (err) {
    res.status(500).json({ error: "Could not cancel order." });
  }
});

app.get("/api/reviews", async (_req, res) => {
  try {
    const rows = await dbAll(
      "SELECT id, customer_name, rating, comment, created_at FROM reviews ORDER BY created_at DESC LIMIT 100"
    );
    const avg = await dbGet("SELECT ROUND(AVG(rating), 2) AS avg_rating, COUNT(*) AS total FROM reviews");
    res.json({ average: avg?.avg_rating || 0, total: avg?.total || 0, reviews: rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reviews." });
  }
});

app.post("/api/reviews", authRequired, async (req, res) => {
  const rating = Math.max(1, Math.min(5, Number(req.body.rating) || 0));
  const comment = String(req.body.comment || "").trim();
  if (!rating || !comment) {
    return res.status(400).json({ error: "Rating and comment are required." });
  }
  try {
    await dbRun("INSERT INTO reviews (user_id, customer_name, rating, comment) VALUES (?, ?, ?, ?)", [
      req.user.id,
      req.user.full_name,
      rating,
      comment,
    ]);
    res.status(201).json({ message: "Review submitted." });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit review." });
  }
});

app.get("/api/about", async (_req, res) => {
  try {
    const about = await dbGet("SELECT content, phone, owner_name, updated_at FROM about WHERE id = 1");
    res.json(about);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch about section." });
  }
});

app.get("/api/profile/summary", authRequired, async (req, res) => {
  try {
    const user = await dbGet(
      "SELECT id, full_name, email, phone, address, role, created_at FROM users WHERE id = ?",
      [req.user.id]
    );

    const orders = await dbGet(
      "SELECT COUNT(*) AS total_orders, COALESCE(ROUND(SUM(total), 2), 0) AS total_spend FROM customer_orders WHERE user_id = ?",
      [req.user.id]
    );

    const lastOrder = await dbGet(
      "SELECT id, status, total, created_at FROM customer_orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
      [req.user.id]
    );

    const favorites = await dbAll(
      `SELECT oi.name, SUM(oi.quantity) AS qty
       FROM order_items oi
       JOIN customer_orders co ON co.id = oi.order_id
       WHERE co.user_id = ?
       GROUP BY oi.name
       ORDER BY qty DESC, oi.name ASC
       LIMIT 5`,
      [req.user.id]
    );

    res.json({
      user,
      stats: {
        total_orders: orders?.total_orders || 0,
        total_spend: orders?.total_spend || 0,
        member_since: user?.created_at || null,
        last_order: lastOrder || null,
      },
      favorites,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load profile summary." });
  }
});

app.put("/api/profile", authRequired, async (req, res) => {
  const fullName = String(req.body.full_name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const phone = String(req.body.phone || "").trim();
  const address = String(req.body.address || "").trim();

  if (!fullName || !email || !phone || !address) {
    return res.status(400).json({ error: "full_name, email, phone and address are required." });
  }

  try {
    const existing = await dbGet("SELECT id FROM users WHERE email = ? AND id != ?", [email, req.user.id]);
    if (existing) {
      return res.status(409).json({ error: "Email already in use." });
    }

    await dbRun("UPDATE users SET full_name = ?, email = ?, phone = ?, address = ? WHERE id = ?", [
      fullName,
      email,
      phone,
      address,
      req.user.id,
    ]);

    const updatedUser = await dbGet("SELECT id, full_name, email, phone, address, role FROM users WHERE id = ?", [
      req.user.id,
    ]);
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found." });
    }

    syncSessionsForUser(updatedUser);
    res.json({ message: "Profile updated.", user: sanitizeUser(updatedUser) });
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile." });
  }
});

app.put("/api/profile/password", authRequired, async (req, res) => {
  const currentPassword = String(req.body.current_password || "");
  const newPassword = String(req.body.new_password || "");
  const confirmPassword = String(req.body.confirm_password || "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: "All password fields are required." });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters." });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: "New password and confirm password do not match." });
  }
  if (currentPassword === newPassword) {
    return res.status(400).json({ error: "New password must be different from current password." });
  }

  try {
    const user = await dbGet("SELECT id, password_hash FROM users WHERE id = ?", [req.user.id]);
    if (!user || user.password_hash !== hashPassword(currentPassword)) {
      return res.status(401).json({ error: "Current password is incorrect." });
    }

    await dbRun("UPDATE users SET password_hash = ? WHERE id = ?", [hashPassword(newPassword), req.user.id]);
    res.json({ message: "Password updated successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to update password." });
  }
});

app.get("/api/admin/orders", authRequired, adminRequired, async (_req, res) => {
  try {
    const rows = await dbAll(
      `SELECT o.id, o.total, o.status, o.created_at, u.full_name, u.phone
       FROM customer_orders o
       JOIN users u ON u.id = o.user_id
       ORDER BY o.created_at DESC
       LIMIT 50`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders." });
  }
});

app.patch("/api/admin/orders/:id/status", authRequired, adminRequired, async (req, res) => {
  const orderId = Number(req.params.id);
  const allowed = new Set(["Preparing", "Baking", "Out for Delivery", "Delivered", "Cancelled"]);
  const status = String(req.body.status || "");
  if (!allowed.has(status)) {
    return res.status(400).json({ error: "Invalid status." });
  }
  try {
    await dbRun("UPDATE customer_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [status, orderId]);
    res.json({ message: "Order status updated." });
  } catch (err) {
    res.status(500).json({ error: "Failed to update order status." });
  }
});

app.put("/api/admin/menu/:id", authRequired, adminRequired, async (req, res) => {
  const id = Number(req.params.id);
  const name = String(req.body.name || "").trim();
  const description = String(req.body.description || "").trim();
  const category = String(req.body.category || "").trim();
  const image = String(req.body.image || "").trim();
  const price = Number(req.body.price);
  if (!name || !category || !Number.isFinite(price)) {
    return res.status(400).json({ error: "name, category and price are required." });
  }
  try {
    await dbRun("UPDATE menu SET name = ?, description = ?, category = ?, image = ?, price = ? WHERE id = ?", [
      name,
      description,
      category,
      image || null,
      price,
      id,
    ]);
    res.json({ message: "Menu item updated." });
  } catch (err) {
    res.status(500).json({ error: "Failed to update menu item." });
  }
});

app.put("/api/admin/about", authRequired, adminRequired, async (req, res) => {
  const content = String(req.body.content || "").trim();
  const phone = String(req.body.phone || "").trim();
  const ownerName = String(req.body.owner_name || "").trim();
  if (!content || !phone || !ownerName) {
    return res.status(400).json({ error: "content, phone and owner_name are required." });
  }
  try {
    await dbRun(
      "UPDATE about SET content = ?, phone = ?, owner_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1",
      [content, phone, ownerName]
    );
    res.json({ message: "About section updated." });
  } catch (err) {
    res.status(500).json({ error: "Failed to update about section." });
  }
});

app.get("/api/admin/analytics", authRequired, adminRequired, async (_req, res) => {
  try {
    const totals = await dbGet(
      `SELECT COUNT(*) AS total_orders, ROUND(SUM(total), 2) AS revenue, ROUND(AVG(total), 2) AS avg_order
       FROM customer_orders
       WHERE status != 'Cancelled'`
    );
    const statuses = await dbAll(
      "SELECT status, COUNT(*) AS count FROM customer_orders GROUP BY status ORDER BY count DESC"
    );
    const reviews = await dbGet("SELECT ROUND(AVG(rating), 2) AS avg_rating, COUNT(*) AS total_reviews FROM reviews");
    res.json({
      total_orders: totals?.total_orders || 0,
      revenue: totals?.revenue || 0,
      avg_order: totals?.avg_order || 0,
      statuses,
      avg_rating: reviews?.avg_rating || 0,
      total_reviews: reviews?.total_reviews || 0,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load analytics." });
  }
});

app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/login", (_req, res) => res.sendFile(path.join(__dirname, "public", "login.html")));
app.get("/signup", (_req, res) => res.sendFile(path.join(__dirname, "public", "signup.html")));
app.get("/dashboard", (_req, res) => res.sendFile(path.join(__dirname, "public", "dashboard.html")));
app.get("/menu", (_req, res) => res.sendFile(path.join(__dirname, "public", "dashboard.html")));
app.get("/profile", (_req, res) => res.sendFile(path.join(__dirname, "public", "profile.html")));
app.get("/order-summary", (_req, res) => res.sendFile(path.join(__dirname, "public", "order-summary.html")));
app.get("/reviews", (_req, res) => res.sendFile(path.join(__dirname, "public", "reviews.html")));
app.get("/about", (_req, res) => res.sendFile(path.join(__dirname, "public", "about.html")));
app.get("/admin", (_req, res) => res.sendFile(path.join(__dirname, "public", "admin.html")));
app.get("/category/:slug", (_req, res) => res.sendFile(path.join(__dirname, "public", "category.html")));

app.get("*", (_req, res) => res.redirect("/dashboard"));

app.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`Firestone Pizzeria running on ${HOST}:${PORT}`);
});
