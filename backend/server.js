require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");
const Razorpay = require("razorpay");

const app = express();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
// ============================
// Server Port
// ============================

const PORT = process.env.PORT || 3000;

// ============================
// Database
// ============================

const db = new Database(path.join(__dirname, "btstore.db"));

db.pragma("foreign_keys = ON");

// ============================
// Products Table
// ============================

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    description TEXT NOT NULL,
    image TEXT NOT NULL,
    file TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`,
).run();

// ============================
// Orders Table
// ============================

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    payment_status TEXT NOT NULL DEFAULT 'PENDING',
    created_at TEXT NOT NULL,

    FOREIGN KEY (product_id)
      REFERENCES products(id)
      ON DELETE CASCADE
  )
`,
).run();

// ============================
// Upload Folders
// ============================

const uploadFolder = path.join(__dirname, "uploads");
const imageFolder = path.join(uploadFolder, "images");
const productFolder = path.join(uploadFolder, "products");

fs.mkdirSync(imageFolder, { recursive: true });
fs.mkdirSync(productFolder, { recursive: true });

// ============================
// Middleware
// ============================

app.use(cors());

app.use(express.json());

app.use("/uploads", express.static(uploadFolder));

// ============================
// File Storage
// ============================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "productImage") {
      cb(null, imageFolder);
    } else if (file.fieldname === "productFile") {
      cb(null, productFolder);
    } else {
      cb(new Error("Invalid file field."));
    }
  },

  filename: function (req, file, cb) {
    const extension = path.extname(file.originalname);

    const filename =
      Date.now() + "-" + Math.round(Math.random() * 1e9) + extension;

    cb(null, filename);
  },
});

const upload = multer({
  storage: storage,
});

// ============================
// Helper: Delete Uploaded File
// ============================

function deleteUploadedFile(filePath, folder) {
  if (!filePath) {
    return;
  }

  const filename = path.basename(filePath);
  const fullPath = path.join(folder, filename);

  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);

      console.log("Deleted file:", fullPath);
    }
  } catch (error) {
    console.error("Could not delete file:", fullPath, error);
  }
}

// ============================
// Add Product
// ============================

app.post(
  "/api/products",

  upload.fields([
    {
      name: "productImage",
      maxCount: 1,
    },
    {
      name: "productFile",
      maxCount: 1,
    },
  ]),

  (req, res) => {
    try {
      const { name, price, description } = req.body;

      if (!name || !price || !description) {
        return res.status(400).json({
          success: false,
          message: "Name, price and description are required.",
        });
      }

      if (!req.files || !req.files.productImage || !req.files.productFile) {
        return res.status(400).json({
          success: false,
          message: "Product image and product file are required.",
        });
      }

      const imageFile = req.files.productImage[0];

      const productFile = req.files.productFile[0];

      const imagePath = `/uploads/images/${imageFile.filename}`;

      const filePath = `/uploads/products/${productFile.filename}`;

      const createdAt = new Date().toISOString();

      const result = db
        .prepare(
          `
          INSERT INTO products (
            name,
            price,
            currency,
            description,
            image,
            file,
            created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        )
        .run(
          name.trim(),
          Number(price),
          "INR",
          description.trim(),
          imagePath,
          filePath,
          createdAt,
        );

      const product = db
        .prepare(
          `
          SELECT *
          FROM products
          WHERE id = ?
        `,
        )
        .get(result.lastInsertRowid);

      console.log("Product saved:", product);

      res.json({
        success: true,
        message: "Product saved successfully!",
        product: product,
      });
    } catch (error) {
      console.error("ADD PRODUCT ERROR:", error);

      res.status(500).json({
        success: false,
        message: "Failed to save product.",
      });
    }
  },
);

// ============================
// Get Products
// ============================

app.get("/api/products", (req, res) => {
  try {
    const products = db
      .prepare(
        `
        SELECT *
        FROM products
        ORDER BY id D
      `,
      )
      .all();

    res.json({
      success: true,
      products: products,
    });
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load products.",
    });
  }
});

// ============================
// Edit Product
// ============================

app.put(
  "/api/products/:id",

  upload.fields([
    {
      name: "productImage",
      maxCount: 1,
    },
    {
      name: "productFile",
      maxCount: 1,
    },
  ]),

  (req, res) => {
    try {
      const productId = Number(req.params.id);

      if (!Number.isInteger(productId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID.",
        });
      }

      const { name, price, description } = req.body;

      const product = db
        .prepare(
          `
          SELECT *
          FROM products
          WHERE id = ?
        `,
        )
        .get(productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found.",
        });
      }

      let imagePath = product.image;

      let filePath = product.file;

      // New Image

      if (
        req.files &&
        req.files.productImage &&
        req.files.productImage.length > 0
      ) {
        const newImage = req.files.productImage[0];

        imagePath = `/uploads/images/${newImage.filename}`;

        deleteUploadedFile(product.image, imageFolder);
      }

      // New Product File

      if (
        req.files &&
        req.files.productFile &&
        req.files.productFile.length > 0
      ) {
        const newFile = req.files.productFile[0];

        filePath = `/uploads/products/${newFile.filename}`;

        deleteUploadedFile(product.file, productFolder);
      }

      // Update Database

      db.prepare(
        `
        UPDATE products
        SET
          name = ?,
          price = ?,
          description = ?,
          image = ?,
          file = ?
        WHERE id = ?
      `,
      ).run(
        name && name.trim() ? name.trim() : product.name,

        price !== undefined && price !== "" ? Number(price) : product.price,

        description && description.trim()
          ? description.trim()
          : product.description,

        imagePath,
        filePath,
        productId,
      );

      const updatedProduct = db
        .prepare(
          `
            SELECT *
            FROM products
            WHERE id = ?
          `,
        )
        .get(productId);

      console.log("Product updated:", updatedProduct);

      res.json({
        success: true,
        message: "Product updated successfully.",
        product: updatedProduct,
      });
    } catch (error) {
      console.error("UPDATE PRODUCT ERROR:", error);

      res.status(500).json({
        success: false,
        message: "Failed to update product.",
      });
    }
  },
);

// ============================
// Delete Product
// ============================

app.delete("/api/products/:id", (req, res) => {
  try {
    const productId = Number(req.params.id);

    if (!Number.isInteger(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const product = db
      .prepare(
        `
          SELECT *
          FROM products
          WHERE id = ?
        `,
      )
      .get(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const deleteProduct = db.transaction(() => {
      // Delete related orders

      db.prepare(
        `
            DELETE FROM orders
            WHERE product_id = ?
          `,
      ).run(productId);

      // Delete product

      db.prepare(
        `
            DELETE FROM products
            WHERE id = ?
          `,
      ).run(productId);
    });

    deleteProduct();

    // Delete image

    deleteUploadedFile(product.image, imageFolder);

    // Delete product file

    deleteUploadedFile(product.file, productFolder);

    console.log("Product deleted:", productId);

    res.json({
      success: true,
      message: "Product and related files deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete product.",
    });
  }
});

// ============================
// Create Razorpay Payment Order
// ============================

app.post("/api/payment/create-order", async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required.",
      });
    }

    const product = db
      .prepare(
        `
        SELECT *
        FROM products
        WHERE id = ?
        `,
      )
      .get(Number(productId));

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const options = {
      amount: Number(product.price) * 100,
      currency: "INR",
      receipt: `product_${product.id}_${Date.now()}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    console.log("Razorpay order created:", razorpayOrder.id);

    res.json({
      success: true,
      message: "Payment order created successfully.",
      order: razorpayOrder,
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        currency: product.currency,
      },
    });
  } catch (error) {
    console.error("CREATE RAZORPAY ORDER ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create payment order.",
    });
  }
});

// ============================
// Create Order
// ============================

app.post("/api/orders", (req, res) => {
  try {
    const { productId, customerName, customerEmail, customerPhone } = req.body;

    if (!productId || !customerName || !customerEmail || !customerPhone) {
      return res.status(400).json({
        success: false,
        message: "All customer details are required.",
      });
    }

    const product = db
      .prepare(
        `
          SELECT *
          FROM products
          WHERE id = ?
        `,
      )
      .get(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const createdAt = new Date().toISOString();

    const result = db
      .prepare(
        `
          INSERT INTO orders (
            product_id,
            customer_name,
            customer_email,
            customer_phone,
            amount,
            currency,
            payment_status,
            created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        product.id,
        customerName.trim(),
        customerEmail.trim(),
        customerPhone.trim(),
        product.price,
        "INR",
        "PENDING",
        createdAt,
      );

    const order = db
      .prepare(
        `
          SELECT *
          FROM orders
          WHERE id = ?
        `,
      )
      .get(result.lastInsertRowid);

    console.log("Order created:", order);

    res.json({
      success: true,
      message: "Order created successfully.",
      order: order,
    });
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create order.",
    });
  }
});

// ============================
// Get Order
// ============================

app.get("/api/orders/:id", (req, res) => {
  try {
    const order = db
      .prepare(
        `
          SELECT *
          FROM orders
          WHERE id = ?
        `,
      )
      .get(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    res.json({
      success: true,
      order: order,
    });
  } catch (error) {
    console.error("GET ORDER ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load order.",
    });
  }
});

// ============================
// Homepage / Health Check
// ============================

app.get("/", (req, res) => {
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">

    <head>
      <meta charset="UTF-8">

      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
      >

      <title>BT Store API</title>

      <style>
        body {
          margin: 0;
          min-height: 100vh;
          display: grid;
          place-items: center;
          background: #07030b;
          color: white;
          font-family: Arial, sans-serif;
        }

        .box {
          width: min(
            520px,
            calc(100% - 40px)
          );

          padding: 30px;
          box-sizing: border-box;
          text-align: center;

          background: #100817;

          border: 1px solid #7d1bd1;
          border-radius: 20px;

          box-shadow:
            0 0 40px
            rgba(157, 32, 255, 0.2);
        }

        h1 {
          color: #c04cff;
        }

        a {
          color: #d477ff;
        }
      </style>
    </head>

    <body>

      <div class="box">

        <h1>BT Store</h1>

        <p>
          Backend server is running successfully.
        </p>

        <p>
          Port:
          ${PORT}
        </p>

        <p>
          <a href="/api/products">
            View Products API
          </a>
        </p>

      </div>

    </body>

    </html>
  `);
});

// ============================
// 404 Handler
// ============================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ============================
// Start Server
// ============================

app.listen(PORT, "0.0.0.0", () => {
  console.log("");
  console.log("================================");
  console.log("          BT STORE");
  console.log("================================");
  console.log("");
  console.log(`BT Store server running on port ${PORT}`);
  console.log("");
});
