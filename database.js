const sqlite3 = require("sqlite3").verbose();
const crypto = require("crypto");
const path = require("path");

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, "firestone.db");
const db = new sqlite3.Database(dbPath);

function hashPassword(password) {
  const salt = "firestone-static-salt-v1";
  return crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
}

const fallbackImage = "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800";

const categoryImageMap = {
  "Classic Pizzas": "https://source.unsplash.com/800x600/?pizza,margherita",
  "Specialty Pizzas": "https://source.unsplash.com/800x600/?gourmet,pizza",
  "Spicy & Desi Flavors": "https://source.unsplash.com/800x600/?spicy,pizza",
  "Starters & Appetizers": "https://source.unsplash.com/800x600/?appetizer,restaurant",
  "Stuffed Crust Options": "https://source.unsplash.com/800x600/?pizza,crust",
  Sizes: "https://source.unsplash.com/800x600/?pizza,size",
  Sides: "https://source.unsplash.com/800x600/?salad,sides",
  Pasta: "https://source.unsplash.com/800x600/?pasta,italian",
  "Other Items": "https://source.unsplash.com/800x600/?burger,shawarma",
  Desserts: "https://source.unsplash.com/800x600/?dessert,cake",
  Beverages: "https://source.unsplash.com/800x600/?beverage,drink",
  "Deals & Combos": "https://source.unsplash.com/800x600/?food,combo,meal",
};

const itemImageMap = {
  "Garlic Bread Classic": "https://source.unsplash.com/800x600/?garlic,bread",
  "Cheesy Garlic Bread": "https://source.unsplash.com/800x600/?cheesy,garlic,bread",
  "Pizza Fries": "https://source.unsplash.com/800x600/?loaded,fries",
  "Chicken Wings (BBQ / Hot / Garlic Parmesan)": "https://source.unsplash.com/800x600/?chicken,wings",
  "Mozzarella Sticks": "https://source.unsplash.com/800x600/?mozzarella,sticks",
  "Stuffed Mushrooms": "https://source.unsplash.com/800x600/?stuffed,mushrooms",
  "Fresh Garden Salad": "https://source.unsplash.com/800x600/?fresh,garden,salad",
  Coleslaw: "https://source.unsplash.com/800x600/?coleslaw",
  "Pasta (Alfredo / Red Sauce)": "https://source.unsplash.com/800x600/?alfredo,pasta",
  "Chicken Nuggets": "https://source.unsplash.com/800x600/?chicken,nuggets",
  "Loaded Nachos": "https://source.unsplash.com/800x600/?loaded,nachos",
  "Chicken Alfredo Pasta": "https://source.unsplash.com/800x600/?chicken,alfredo,pasta",
  "Creamy Mushroom Pasta": "https://source.unsplash.com/800x600/?mushroom,pasta",
  "Spaghetti Bolognese": "https://source.unsplash.com/800x600/?spaghetti,bolognese",
  "Baked Mac & Cheese": "https://source.unsplash.com/800x600/?baked,mac,and,cheese",
  "Beef Burger": "https://source.unsplash.com/800x600/?beef,burger",
  "Zinger Burger": "https://source.unsplash.com/800x600/?crispy,chicken,burger",
  "Chicken Shawarma": "https://source.unsplash.com/800x600/?chicken,shawarma",
  "Panini Sandwiches": "https://source.unsplash.com/800x600/?panini,sandwich",
  "Chocolate Lava Cake": "https://source.unsplash.com/800x600/?chocolate,lava,cake",
  "Brownie with Ice Cream": "https://source.unsplash.com/800x600/?brownie,ice,cream",
  "Cinnamon Rolls": "https://source.unsplash.com/800x600/?cinnamon,rolls",
  Tiramisu: "https://source.unsplash.com/800x600/?tiramisu,dessert",
  "Soft Drinks (Regular / Large)": "https://source.unsplash.com/800x600/?soft,drinks",
  "Fresh Lime": "https://source.unsplash.com/800x600/?fresh,lime,drink",
  "Mint Margarita": "https://source.unsplash.com/800x600/?mint,margarita,drink",
  "Iced Tea": "https://source.unsplash.com/800x600/?iced,tea",
  "Mineral Water": "https://source.unsplash.com/800x600/?mineral,water,bottle",
  "Milkshakes (Chocolate / Strawberry / Vanilla)": "https://source.unsplash.com/800x600/?milkshake",
  "Family Deal": "https://source.unsplash.com/800x600/?pizza,meal,deal",
  "Couple Deal": "https://source.unsplash.com/800x600/?dinner,for,two",
  "Student Deal": "https://source.unsplash.com/800x600/?fast,food,meal",
  "Party Box": "https://source.unsplash.com/800x600/?party,food,box",
};

function resolveImage(name, category) {
  return itemImageMap[name] || categoryImageMap[category] || fallbackImage;
}

const menuSeed = [
  ["Garlic Bread Classic", "Freshly baked bread with garlic butter", 5.99, "Starters & Appetizers", fallbackImage, 1],
  ["Cheesy Garlic Bread", "Toasted bread with premium mozzarella", 6.99, "Starters & Appetizers", fallbackImage, 1],
  ["Pizza Fries", "Crispy fries loaded with pizza sauce and cheese", 7.49, "Starters & Appetizers", fallbackImage, 0],
  ["Chicken Wings (BBQ / Hot / Garlic Parmesan)", "Saucy wings with bold flavor", 9.99, "Starters & Appetizers", fallbackImage, 1],
  ["Mozzarella Sticks", "Golden fried sticks with marinara", 7.99, "Starters & Appetizers", fallbackImage, 0],
  ["Stuffed Mushrooms", "Cheese-stuffed mushrooms baked to perfection", 8.49, "Starters & Appetizers", fallbackImage, 0],

  ["Margherita", "Fresh basil, mozzarella, and tomato sauce", 12.99, "Classic Pizzas", fallbackImage, 1],
  ["Pepperoni", "Premium pepperoni and house mozzarella", 14.99, "Classic Pizzas", fallbackImage, 1],
  ["BBQ Chicken", "Tender chicken, smoky BBQ glaze, onions", 15.99, "Classic Pizzas", fallbackImage, 0],
  ["Veggie Supreme", "Bell peppers, olives, onions, mushrooms", 14.49, "Classic Pizzas", fallbackImage, 0],
  ["Cheese Lovers", "Mozzarella, cheddar, parmesan blend", 14.99, "Classic Pizzas", fallbackImage, 0],

  ["Supreme Deluxe", "Chicken, pepperoni, olives, capsicum", 17.99, "Specialty Pizzas", fallbackImage, 1],
  ["Meat Feast", "Chicken, sausage, pepperoni, beef toppings", 18.99, "Specialty Pizzas", fallbackImage, 1],
  ["Tandoori Chicken Pizza", "Spiced tandoori chicken with herbs", 17.49, "Specialty Pizzas", fallbackImage, 1],
  ["Fajita Pizza", "Fajita chicken, onions, peppers", 16.99, "Specialty Pizzas", fallbackImage, 0],
  ["Hawaiian", "Roasted chicken and pineapple", 16.49, "Specialty Pizzas", fallbackImage, 0],
  ["Four Cheese", "Mozzarella, cheddar, feta, parmesan", 17.49, "Specialty Pizzas", fallbackImage, 0],

  ["Malai Boti Pizza", "Creamy malai chicken on rich sauce", 17.99, "Spicy & Desi Flavors", fallbackImage, 1],
  ["Seekh Kebab Pizza", "Seekh kebab chunks and onions", 18.49, "Spicy & Desi Flavors", fallbackImage, 1],
  ["Chapli Kebab Pizza", "Chapli kebab crumble and herbs", 18.49, "Spicy & Desi Flavors", fallbackImage, 0],
  ["Achari Chicken Pizza", "Pickle-style spicy chicken flavor", 17.49, "Spicy & Desi Flavors", fallbackImage, 0],
  ["Peri Peri Chicken Pizza", "Hot peri peri chicken and peppers", 17.49, "Spicy & Desi Flavors", fallbackImage, 0],

  ["Cheese Stuffed Crust", "Add melty cheese in crust", 2.99, "Stuffed Crust Options", fallbackImage, 0],
  ["Sausage Stuffed Crust", "Add savory sausage in crust", 3.49, "Stuffed Crust Options", fallbackImage, 0],
  ["Cream Cheese Crust", "Add cream cheese-filled crust", 2.99, "Stuffed Crust Options", fallbackImage, 0],
  ["Garlic Butter Crust", "Garlic butter glaze crust finish", 1.99, "Stuffed Crust Options", fallbackImage, 0],

  ['Small (8")', "Size option", 0, "Sizes", fallbackImage, 0],
  ['Medium (12")', "Size option", 2.5, "Sizes", fallbackImage, 0],
  ['Large (14")', "Size option", 5.0, "Sizes", fallbackImage, 0],
  ['Extra Large (16")', "Size option", 7.5, "Sizes", fallbackImage, 0],

  ["Fresh Garden Salad", "Crisp greens and house dressing", 6.99, "Sides", fallbackImage, 0],
  ["Coleslaw", "Creamy and refreshing slaw", 4.49, "Sides", fallbackImage, 0],
  ["Pasta (Alfredo / Red Sauce)", "Choose your pasta sauce", 9.99, "Sides", fallbackImage, 0],
  ["Chicken Nuggets", "Crispy chicken bites", 7.49, "Sides", fallbackImage, 0],
  ["Loaded Nachos", "Cheese-loaded nachos with toppings", 10.99, "Sides", fallbackImage, 0],

  ["Chicken Alfredo Pasta", "Creamy alfredo with grilled chicken", 12.99, "Pasta", fallbackImage, 1],
  ["Creamy Mushroom Pasta", "Mushroom cream sauce and herbs", 11.99, "Pasta", fallbackImage, 0],
  ["Spaghetti Bolognese", "Classic beef bolognese sauce", 12.49, "Pasta", fallbackImage, 1],
  ["Baked Mac & Cheese", "Baked pasta with rich cheese blend", 11.49, "Pasta", fallbackImage, 0],

  ["Beef Burger", "Juicy beef patty with signature sauce", 9.99, "Other Items", fallbackImage, 0],
  ["Zinger Burger", "Crispy spicy chicken burger", 10.49, "Other Items", fallbackImage, 1],
  ["Chicken Shawarma", "Wrap with marinated chicken and garlic sauce", 8.99, "Other Items", fallbackImage, 0],
  ["Panini Sandwiches", "Pressed panini with cheese filling", 9.49, "Other Items", fallbackImage, 0],

  ["Chocolate Lava Cake", "Warm cake with molten chocolate center", 7.49, "Desserts", fallbackImage, 1],
  ["Brownie with Ice Cream", "Classic brownie with vanilla scoop", 7.99, "Desserts", fallbackImage, 1],
  ["Cinnamon Rolls", "Soft rolls with cinnamon glaze", 6.99, "Desserts", fallbackImage, 0],
  ["Nutella Pizza", "Sweet pizza with Nutella spread", 9.49, "Desserts", fallbackImage, 1],
  ["Tiramisu", "Layered Italian coffee dessert", 8.49, "Desserts", fallbackImage, 0],

  ["Soft Drinks (Regular / Large)", "Cola, lemon-lime, orange", 2.49, "Beverages", fallbackImage, 0],
  ["Fresh Lime", "Fresh lime cooler", 2.99, "Beverages", fallbackImage, 0],
  ["Mint Margarita", "Minty lemon refreshment", 3.49, "Beverages", fallbackImage, 1],
  ["Iced Tea", "Chilled tea with lemon", 2.99, "Beverages", fallbackImage, 0],
  ["Mineral Water", "Pure bottled water", 1.49, "Beverages", fallbackImage, 0],
  ["Milkshakes (Chocolate / Strawberry / Vanilla)", "Hand-blended milkshake options", 4.99, "Beverages", fallbackImage, 1],

  ["Family Deal", "2 Large Pizzas + 1.5L Drink", 32.99, "Deals & Combos", fallbackImage, 1],
  ["Couple Deal", "1 Medium Pizza + 2 Drinks", 19.99, "Deals & Combos", fallbackImage, 1],
  ["Student Deal", "Small Pizza + Fries + Drink", 13.99, "Deals & Combos", fallbackImage, 1],
  ["Party Box", "3 Large Pizzas + Wings + Drinks", 54.99, "Deals & Combos", fallbackImage, 1],
];

const hydratedMenuSeed = menuSeed.map(([name, description, price, category, _image, isPopular]) => [
  name,
  description,
  price,
  category,
  resolveImage(name, category),
  isPopular,
]);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS menu (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    category TEXT NOT NULL,
    image TEXT,
    is_popular INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    address TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS customer_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'Preparing',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    menu_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    size TEXT,
    crust TEXT,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    line_total REAL NOT NULL,
    FOREIGN KEY(order_id) REFERENCES customer_orders(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    customer_name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.all("PRAGMA table_info(reviews)", (err, cols) => {
    if (err || !Array.isArray(cols)) return;
    const hasUserId = cols.some((col) => col.name === "user_id");
    if (!hasUserId) {
      db.run("ALTER TABLE reviews ADD COLUMN user_id INTEGER");
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS about (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    content TEXT NOT NULL,
    phone TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  const menuStmt = db.prepare(
    `INSERT INTO menu (name, description, price, category, image, is_popular)
     SELECT ?, ?, ?, ?, ?, ?
     WHERE NOT EXISTS (
       SELECT 1 FROM menu WHERE name = ? AND category = ?
     )`
  );

  hydratedMenuSeed.forEach((item) => {
    menuStmt.run([...item, item[0], item[3]]);
  });
  menuStmt.finalize();

  const imageUpdateStmt = db.prepare("UPDATE menu SET image = ? WHERE name = ? AND category = ?");
  hydratedMenuSeed.forEach((item) => {
    imageUpdateStmt.run([item[4], item[0], item[3]]);
  });
  imageUpdateStmt.finalize();

  // Remove legacy duplicate menu rows from older seeds; keep newest by name.
  db.run(
    `DELETE FROM menu
     WHERE id NOT IN (
       SELECT MAX(id) FROM menu GROUP BY name
     )`
  );

  db.run(
    `INSERT INTO about (id, content, phone, owner_name)
     SELECT 1, ?, ?, ?
     WHERE NOT EXISTS (SELECT 1 FROM about WHERE id = 1)`,
    [
      "Welcome to FIRESTONE PIZZERIA. We specialize in premium wood-fired pizzas made with fresh dough and high-quality ingredients. Our mission is to deliver unforgettable flavors in every bite.",
      "92xxxxxxxxx",
      "Owner Name",
    ]
  );

  db.run(
    `INSERT INTO users (full_name, email, phone, password_hash, address, role)
     SELECT ?, ?, ?, ?, ?, 'admin'
     WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = ?)`,
    ["Firestone Admin", "admin@firestone.com", "920000000000", hashPassword("admin123"), "Head Office", "admin@firestone.com"]
  );
});

module.exports = db;
module.exports.hashPassword = hashPassword;
