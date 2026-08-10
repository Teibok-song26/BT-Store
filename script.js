// ============================
// API
// ============================

const API_URL = "http://localhost:3000";

const productsContainer = document.getElementById("productsContainer");

// ============================
// Currency
// ============================

function formatPrice(price) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(price));
}

// ============================
// Load Products
// ============================

async function loadProducts() {
  try {
    productsContainer.innerHTML = `
            <p class="loading">
                Loading products...
            </p>
        `;

    const response = await fetch(`${API_URL}/api/products`);

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Could not load products.");
    }

    displayProducts(data.products || []);
  } catch (error) {
    console.error("Load products error:", error);

    productsContainer.innerHTML = `
            <p class="loading">
                Unable to load products.<br>
                Please try again later.
            </p>
        `;
  }
}

// ============================
// Display Products
// ============================

function displayProducts(products) {
  productsContainer.innerHTML = "";

  if (!Array.isArray(products) || products.length === 0) {
    productsContainer.innerHTML = `
            <p class="loading">
                No products available yet.
            </p>
        `;

    return;
  }

  products.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";

    // ============================
    // Product Image
    // ============================

    const image = document.createElement("img");

    image.src = `${API_URL}${product.image}`;
    image.alt = product.name || "Product";
    image.loading = "lazy";

    image.onerror = () => {
      image.style.display = "none";
    };

    // ============================
    // Product Info
    // ============================

    const info = document.createElement("div");
    info.className = "product-info";

    const title = document.createElement("h3");
    title.textContent = product.name || "Unnamed Product";

    const description = document.createElement("p");
    description.textContent =
      product.description || "No description available.";

    // ============================
    // Bottom Row
    // ============================

    const bottom = document.createElement("div");
    bottom.className = "product-bottom";

    const price = document.createElement("span");
    price.className = "product-price";
    price.textContent = formatPrice(product.price);

    const button = document.createElement("button");

    button.type = "button";
    button.className = "view-button";
    button.textContent = "View";

    button.addEventListener("click", () => {
      viewProduct(product.id);
    });

    // ============================
    // Build Card
    // ============================

    bottom.appendChild(price);
    bottom.appendChild(button);

    info.appendChild(title);
    info.appendChild(description);
    info.appendChild(bottom);

    card.appendChild(image);
    card.appendChild(info);

    productsContainer.appendChild(card);
  });
}

// ============================
// View Product
// ============================

function viewProduct(id) {
  if (!id) {
    console.error("Product ID is missing.");
    return;
  }

  window.location.href = `product.html?id=${encodeURIComponent(id)}`;
}

// ============================
// Start
// ============================

loadProducts();
