const API_URL = "https://bt-store.onrender.com";

// ============================
// Elements
// ============================

const productForm = document.getElementById("productForm");
const productName = document.getElementById("productName");
const productImage = document.getElementById("productImage");
const productFile = document.getElementById("productFile");
const productPrice = document.getElementById("productPrice");
const productDescription = document.getElementById("productDescription");

const imagePreview = document.getElementById("imagePreview");
const productList = document.getElementById("productList");
const message = document.getElementById("message");

const formTitle = document.getElementById("formTitle");
const submitButton = document.getElementById("submitButton");
const cancelEditButton = document.getElementById("cancelEditButton");
const refreshButton = document.getElementById("refreshButton");

// ============================
// Edit State
// ============================

let editingProductId = null;

// ============================
// Image Preview
// ============================

productImage.addEventListener("change", () => {
  const file = productImage.files[0];

  if (!file) {
    imagePreview.src = "";
    imagePreview.style.display = "none";
    return;
  }

  const imageURL = URL.createObjectURL(file);

  imagePreview.src = imageURL;
  imagePreview.style.display = "block";
});

// ============================
// Load Products
// ============================

async function loadProducts() {
  try {
    productList.innerHTML = `
      <p class="loading">Loading products...</p>
    `;

    const response = await fetch(`${API_URL}/api/products`);

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();

    console.log("Products:", data);

    if (!data.success) {
      throw new Error(data.message || "Failed to load products.");
    }

    displayProducts(data.products);
  } catch (error) {
    console.error("LOAD PRODUCTS ERROR:", error);

    productList.innerHTML = `
      <p class="error-message">
        Failed to load products.
      </p>
    `;

<<<<<<< HEAD
    showMessage(
      error.message || "Could not connect to the server.",
      "error"
    );
=======
    showMessage(error.message || "Could not connect to the server.", "error");
>>>>>>> 5352bb9 (Update payment and frontend)
  }
}

// ============================
// Display Products
// ============================

function displayProducts(products) {
  productList.innerHTML = "";

  if (!products || products.length === 0) {
    productList.innerHTML = `
      <p class="empty-products">
        No products available.
      </p>
    `;

    return;
  }

  products.forEach((product) => {
    const card = document.createElement("div");

    card.className = "admin-product-card";

    card.innerHTML = `
      <img
        src="${API_URL}${product.image}"
        class="admin-product-image"
        alt="${escapeHTML(product.name)}"
      >

      <div class="admin-product-info">

        <h3>
          ${escapeHTML(product.name)}
        </h3>

        <p class="admin-price">
          ₹${Number(product.price).toLocaleString("en-IN")}
        </p>

        <p class="admin-description">
          ${escapeHTML(product.description)}
        </p>

        <div class="admin-actions">

          <button
            type="button"
            class="edit-button"
            data-id="${product.id}"
          >
            ✏️ Edit
          </button>

          <button
            type="button"
            class="delete-button"
            data-id="${product.id}"
          >
            🗑️ Delete
          </button>

        </div>

      </div>
    `;

    productList.appendChild(card);
  });

  // Edit buttons

  document.querySelectorAll(".edit-button").forEach((button) => {
    button.addEventListener("click", () => {
      startEdit(Number(button.dataset.id));
    });
  });

  // Delete buttons

  document.querySelectorAll(".delete-button").forEach((button) => {
    button.addEventListener("click", () => {
      deleteProduct(Number(button.dataset.id));
    });
  });
}

// ============================
// Start Edit
// ============================

async function startEdit(productId) {
  try {
    const response = await fetch(`${API_URL}/api/products`);

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(
        data.message || "Failed to load products."
      );
    }

    const product = data.products.find(
      (item) => Number(item.id) === Number(productId)
    );

    if (!product) {
      showMessage("Product not found.", "error");
      return;
    }

    editingProductId = Number(product.id);

    productName.value = product.name;
    productPrice.value = product.price;
    productDescription.value = product.description;

    if (product.image) {
      imagePreview.src = `${API_URL}${product.image}`;
      imagePreview.style.display = "block";
    }

    formTitle.textContent = "Edit Product";
    submitButton.textContent = "Save Changes";
    cancelEditButton.style.display = "block";

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  } catch (error) {
    console.error("EDIT ERROR:", error);

<<<<<<< HEAD
    showMessage(
      error.message || "Could not load product.",
      "error"
    );
=======
    showMessage(error.message || "Could not load product.", "error");
>>>>>>> 5352bb9 (Update payment and frontend)
  }
}

// ============================
// Form Submit
// ============================

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (editingProductId !== null) {
    await updateProduct();
  } else {
    await addProduct();
  }
});

// ============================
// Add Product
// ============================

async function addProduct() {
  const image = productImage.files[0];
  const file = productFile.files[0];

  if (!image) {
    showMessage(
      "Please choose a product image.",
      "error"
    );
    return;
  }

  if (!file) {
    showMessage(
      "Please choose a product file.",
      "error"
    );
    return;
  }

  const name = productName.value.trim();
  const price = productPrice.value;
  const description = productDescription.value.trim();

  if (!name || !price || !description) {
    showMessage(
      "Please fill in all product details.",
      "error"
    );
    return;
  }

  const name = productName.value.trim();

  const price = productPrice.value;

  const description = productDescription.value.trim();

  if (!name || !price || !description) {
    showMessage("Please fill in all product details.", "error");

    return;
  }

  const formData = new FormData();

  formData.append("name", name);
<<<<<<< HEAD
  formData.append("price", price);
  formData.append("description", description);
=======

  formData.append("price", price);

  formData.append("description", description);

>>>>>>> 5352bb9 (Update payment and frontend)
  formData.append("productImage", image);
  formData.append("productFile", file);

  try {
    submitButton.disabled = true;
    submitButton.textContent = "Adding...";

    const response = await fetch(
      `${API_URL}/api/products`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(
        `Server error: ${response.status}`
      );
    }

    const data = await response.json();

    console.log("ADD PRODUCT RESPONSE:", data);

<<<<<<< HEAD
    if (!data.success) {
      throw new Error(
        data.message || "Failed to add product."
      );
=======
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to add product.");
>>>>>>> 5352bb9 (Update payment and frontend)
    }

    showMessage(
      "Product added successfully!",
      "success"
    );

    resetForm();

    await loadProducts();
  } catch (error) {
    console.error("ADD PRODUCT ERROR:", error);

<<<<<<< HEAD
    showMessage(
      error.message || "Could not connect to server.",
      "error"
    );
=======
    showMessage(error.message || "Could not connect to server.", "error");
>>>>>>> 5352bb9 (Update payment and frontend)
  } finally {
    submitButton.disabled = false;

    if (editingProductId === null) {
      submitButton.textContent = "+ Add Product";
    }
  }
}

// ============================
// Update Product
// ============================

async function updateProduct() {
  if (editingProductId === null) {
    return;
  }

  const formData = new FormData();

  formData.append(
    "name",
    productName.value.trim()
  );

  formData.append(
    "price",
    productPrice.value
  );

  formData.append(
    "description",
    productDescription.value.trim()
  );

  if (productImage.files[0]) {
    formData.append(
      "productImage",
      productImage.files[0]
    );
  }

  if (productFile.files[0]) {
    formData.append(
      "productFile",
      productFile.files[0]
    );
  }

  try {
    submitButton.disabled = true;
    submitButton.textContent = "Saving...";

    const response = await fetch(
      `${API_URL}/api/products/${editingProductId}`,
      {
        method: "PUT",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(
        `Server error: ${response.status}`
      );
    }

    const data = await response.json();

    console.log("UPDATE PRODUCT RESPONSE:", data);

    if (!data.success) {
      throw new Error(
        data.message || "Failed to update product."
      );
    }

    showMessage(
      "Product updated successfully!",
      "success"
    );

    resetForm();

    await loadProducts();
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);

<<<<<<< HEAD
    showMessage(
      error.message || "Could not update product.",
      "error"
    );
=======
    showMessage(error.message || "Could not update product.", "error");
>>>>>>> 5352bb9 (Update payment and frontend)
  } finally {
    submitButton.disabled = false;

    if (editingProductId !== null) {
      submitButton.textContent = "Save Changes";
    }
  }
}

// ============================
// Delete Product
// ============================

async function deleteProduct(productId) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this product?"
  );

  if (!confirmed) {
    return;
  }

  try {
<<<<<<< HEAD
    console.log("Deleting product:", productId);

    const response = await fetch(
      `${API_URL}/api/products/${productId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error(
        `Server error: ${response.status}`
      );
    }

    const data = await response.json();

    console.log("DELETE PRODUCT RESPONSE:", data);

    if (!data.success) {
      throw new Error(
        data.message || "Failed to delete product."
      );
=======
    const response = await fetch(`${API_URL}/api/products/${productId}`, {
      method: "DELETE",
    });

    const data = await response.json();

    console.log("DELETE RESPONSE:", data);

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to delete product.");
>>>>>>> 5352bb9 (Update payment and frontend)
    }

    if (editingProductId === Number(productId)) {
      resetForm();
    }

    showMessage(
      "Product deleted successfully!",
      "success"
    );

    await loadProducts();
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);

<<<<<<< HEAD
    showMessage(
      error.message || "Failed to delete product.",
      "error"
    );
=======
    showMessage(error.message || "Failed to delete product.", "error");
>>>>>>> 5352bb9 (Update payment and frontend)
  }
}

// ============================
// Cancel Edit
// ============================

cancelEditButton.addEventListener("click", () => {
  resetForm();
});

// ============================
// Refresh
// ============================

if (refreshButton) {
  refreshButton.addEventListener("click", () => {
    loadProducts();
  });
}

// ============================
// Reset Form
// ============================

function resetForm() {
  editingProductId = null;

  productForm.reset();

  formTitle.textContent = "Add Product";

  submitButton.textContent = "+ Add Product";

  submitButton.disabled = false;

  cancelEditButton.style.display = "none";

  imagePreview.src = "";
  imagePreview.style.display = "none";
}

// ============================
// Messages
// ============================

function showMessage(text, type) {
  message.innerHTML = "";

  const paragraph = document.createElement("p");

  paragraph.textContent = text;

  paragraph.className =
    type === "success"
      ? "success-message"
      : "error-message";

  message.appendChild(paragraph);
}

// ============================
// HTML Escape
// ============================

function escapeHTML(value) {
  const div = document.createElement("div");

  div.textContent = value ?? "";

  return div.innerHTML;
}

// ============================
// Initial Load
// ============================

loadProducts();
