const API_BASE = window.location.origin + '/api';
let token = localStorage.getItem('token') || null;
let currentUser = localStorage.getItem('currentUser');
currentUser = currentUser ? JSON.parse(currentUser) : null;

let sortState = {
    name: 'asc',
    price: 'asc',
    category: 'asc',
    stock: 'asc',
    rating: 'asc'
};

document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    const loginLink = document.getElementById('loginLink');
    const registerLink = document.getElementById('registerLink');

    if (logoutBtn) {
        if (token && currentUser) {
            logoutBtn.classList.remove('d-none');
            if (loginLink) loginLink.classList.add('d-none');
            if (registerLink) registerLink.classList.add('d-none');
            logoutBtn.addEventListener('click', logoutUser);
        }
    }

    const path = window.location.pathname;
    if (path.endsWith('index.html') || path === '/' || path === '') {
        initHomePage();
    } else if (path.endsWith('login.html')) {
        initLoginPage();
    } else if (path.endsWith('register.html')) {
        initRegisterPage();
    } else if (path.endsWith('product.html')) {
        initProductPage();
    } else if (path.endsWith('cart.html')) {
        initCartPage();
    } else if (path.endsWith('admin-products.html')) {
        initAdminProductsPage();
    } else if (path.endsWith('admin-orders.html')) {
        initAdminOrdersPage();
    }
});

function logoutUser() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    token = null;
    currentUser = null;
    window.location.href = 'index.html';
}

function initHomePage() {
    const filterForm = document.getElementById('filterForm');
    filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        fetchAndRenderProducts();
    });

    const toggleCategoriesBtn = document.getElementById('toggleCategoriesBtn');
    const categoryContainer = document.getElementById('categoryContainer');

    toggleCategoriesBtn.addEventListener('click', () => {
        categoryContainer.classList.toggle('hidden');
    });

    const sortNameBtn = document.getElementById('sortNameBtn');
    const sortPriceBtn = document.getElementById('sortPriceBtn');
    const sortCategoryBtn = document.getElementById('sortCategoryBtn');
    const sortStockBtn = document.getElementById('sortStockBtn');
    const sortRatingBtn = document.getElementById('sortRatingBtn');

    sortNameBtn.addEventListener('click', () => toggleSort('name'));
    sortPriceBtn.addEventListener('click', () => toggleSort('price'));
    sortCategoryBtn.addEventListener('click', () => toggleSort('category'));
    sortStockBtn.addEventListener('click', () => toggleSort('stock'));
    sortRatingBtn.addEventListener('click', () => toggleSort('rating'));

    const categoryChecks = document.querySelectorAll('.categoryCheck');
    categoryChecks.forEach((chk) => {
        chk.addEventListener('change', () => {
            enforceCategoryLimit();
        });
    });

    fetchAndRenderProducts();
}

function enforceCategoryLimit() {
    const categoryChecks = Array.from(document.querySelectorAll('.categoryCheck'));
    const checked = categoryChecks.filter((c) => c.checked);
    if (checked.length >= 3) {
        categoryChecks.forEach((c) => {
            if (!c.checked) {
                c.disabled = true;
            }
        });
    } else {
        categoryChecks.forEach((c) => {
            c.disabled = false;
        });
    }
}

async function fetchAndRenderProducts() {
    const productsContainer = document.getElementById('productsContainer');
    productsContainer.innerHTML = 'Loading...';

    const formData = new FormData(document.getElementById('filterForm'));
    const searchParams = new URLSearchParams();

    const search = formData.get('search');
    if (search) searchParams.append('search', search);

    const minRating = formData.get('minRating');
    if (minRating) searchParams.append('rating', minRating);

    const inStock = formData.get('inStock');
    if (inStock === 'on') {
        searchParams.append('inStock', 'true');
    }

    const categories = [];
    const categoryChecks = document.querySelectorAll('.categoryCheck');
    categoryChecks.forEach((c) => {
        if (c.checked) {
            categories.push(c.value);
        }
    });
    if (categories.length) {
        searchParams.append('categories', categories.join(','));
    }

    try {
        const res = await fetch(`${API_BASE}/products?${searchParams.toString()}`, {
            headers: token ? { Authorization: 'Bearer ' + token } : {}
        });
        let products = await res.json();
        if (!Array.isArray(products)) {
            productsContainer.innerHTML = 'Error fetching products.';
            return;
        }

        const minR = Number(minRating || 0);
        products = products.filter(p => p.rating >= minR);

        if (categories.length) {
            products = products.filter(p => {
                // есть ли пересечение?
                const setProductCats = new Set(p.categories || []);
                return categories.some(cat => setProductCats.has(cat));
            });
        }

        products = applySorting(products);

        renderProducts(products, productsContainer);
    } catch (error) {
        console.error(error);
        productsContainer.innerHTML = 'Error fetching products.';
    }
}

function applySorting(products) {

    if (!window.currentSortField) return products;

    const field = window.currentSortField;
    const direction = sortState[field];

    return products.sort((a, b) => {
        let valA = a[field];
        let valB = b[field];

        if (field === 'name') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        } else if (field === 'category') {
            valA = (a.categories && a.categories[0]) ? a.categories[0].toLowerCase() : '';
            valB = (b.categories && b.categories[0]) ? b.categories[0].toLowerCase() : '';
            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        } else {
            valA = Number(valA) || 0;
            valB = Number(valB) || 0;
            return direction === 'asc' ? valA - valB : valB - valA;
        }
    });
}

function toggleSort(field) {
    if (sortState[field] === 'asc') sortState[field] = 'desc';
    else sortState[field] = 'asc';

    window.currentSortField = field;
    fetchAndRenderProducts();
}

function renderProducts(products, container) {
    container.innerHTML = '';
    products.forEach((p) => {
        const col = document.createElement('div');
        col.className = 'col-md-3 mb-3';

        const card = document.createElement('div');
        card.className = 'card';

        if (p.images && p.images.length > 0) {
            const img = document.createElement('img');
            img.src = p.images[0];
            img.className = 'card-img-top';
            card.appendChild(img);
        }

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        const catStr = (p.categories || []).join(', ');
        cardBody.innerHTML = `
      <h5 class="card-title">${p.name}</h5>
      <p class="card-text">Price: $${p.price}</p>
      <p class="card-text">Stock: ${p.stock}</p>
      <p class="card-text">Rating: ${p.rating}</p>
      <p class="card-text">Categories: ${catStr}</p>
      <p class="card-text text-truncate">${p.description}</p>
    `;
        const viewBtn = document.createElement('a');
        viewBtn.className = 'btn btn-primary';
        viewBtn.innerText = 'View';
        viewBtn.href = `product.html?id=${p._id}`;

        cardBody.appendChild(viewBtn);
        card.appendChild(cardBody);
        col.appendChild(card);
        container.appendChild(col);
    });
}

function initLoginPage() {
    const form = document.getElementById('loginForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('emailInput').value;
        const password = document.getElementById('passwordInput').value;

        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (res.ok) {
                token = data.token;
                currentUser = data.user;
                localStorage.setItem('token', token);
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                alert('Login successful!');
                window.location.href = 'index.html';
            } else {
                alert(data.message || 'Error logging in');
            }
        } catch (error) {
            console.error(error);
            alert('Error logging in');
        }
    });
}

function initRegisterPage() {
    const form = document.getElementById('registerForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('nameInput').value;
        const email = document.getElementById('emailInput').value;
        const password = document.getElementById('passwordInput').value;

        try {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            const data = await res.json();
            if (res.ok) {
                alert('Registration successful! Please login.');
                window.location.href = 'login.html';
            } else {
                alert(data.message || 'Error registering');
            }
        } catch (error) {
            console.error(error);
            alert('Error registering');
        }
    });
}

function initProductPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    if (!productId) {
        alert('No product ID provided');
        return;
    }

    const productNameEl = document.getElementById('productName');
    const productPriceEl = document.getElementById('productPrice');
    const productDescriptionEl = document.getElementById('productDescription');
    const productImageEl = document.getElementById('productImage');
    const addToCartBtn = document.getElementById('addToCartBtn');
    const quantityInput = document.getElementById('quantityInput');

    (async function fetchProduct() {
        try {
            const res = await fetch(`${API_BASE}/products/${productId}`, {
                headers: token ? { Authorization: 'Bearer ' + token } : {}
            });
            if (!res.ok) {
                alert('Error fetching product');
                return;
            }
            const product = await res.json();
            productNameEl.textContent = product.name;
            productPriceEl.textContent = '$' + product.price;
            productDescriptionEl.textContent = product.description;
            if (product.images && product.images.length > 0) {
                productImageEl.src = product.images[0];
            } else {
                productImageEl.src = 'https://via.placeholder.com/400?text=No+Image';
            }
        } catch (error) {
            console.error(error);
            alert('Error fetching product');
        }
    })();

    addToCartBtn.addEventListener('click', () => {
        const qty = parseInt(quantityInput.value) || 1;
        addToCart(productId, qty);
        alert('Item added to cart!');
    });
}

function addToCart(productId, quantity) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const index = cart.findIndex((item) => item.productId === productId);
    if (index >= 0) {
        cart[index].quantity += quantity;
    } else {
        cart.push({ productId, quantity });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
}

function initCartPage() {
    const cartContainer = document.getElementById('cartContainer');
    const checkoutBtn = document.getElementById('checkoutBtn');

    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        cartContainer.innerHTML = '<p>Your cart is empty.</p>';
    } else {
        renderCart(cart, cartContainer);
    }

    checkoutBtn.addEventListener('click', () => {
        if (!token) {
            alert('Please login to checkout.');
            window.location.href = 'login.html';
            return;
        }
        checkout(cart);
    });
}

async function renderCart(cart, container) {
    container.innerHTML = 'Loading...';
    let total = 0;
    let html = '';

    for (let item of cart) {
        try {
            const res = await fetch(`${API_BASE}/products/${item.productId}`, {
                headers: token ? { Authorization: 'Bearer ' + token } : {}
            });
            if (!res.ok) continue;
            const p = await res.json();
            const cost = p.price * item.quantity;
            total += cost;

            html += `
        <div class="card mb-2 p-2">
          <div class="d-flex align-items-center">
            <img
              src="${(p.images && p.images.length > 0) ? p.images[0] : 'https://via.placeholder.com/100'}"
              style="width: 80px; height: 80px; object-fit: cover;"
              class="me-3"
            />
            <div>
              <h5 class="mb-0">${p.name}</h5>
              <p class="mb-0">$${p.price} x ${item.quantity} = $${cost}</p>
            </div>
          </div>
        </div>
      `;
        } catch (error) {
            console.error(error);
        }
    }
    html += `<h4>Total: $${total}</h4>`;
    container.innerHTML = html;
}

async function checkout(cart) {
    try {
        const products = cart.map((c) => ({
            productId: c.productId,
            quantity: c.quantity
        }));
        const res = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token
            },
            body: JSON.stringify({ products })
        });
        const data = await res.json();
        if (res.ok) {
            alert('Order placed successfully!');
            localStorage.removeItem('cart');
            window.location.href = 'index.html';
        } else {
            alert(data.message || 'Error placing order');
        }
    } catch (error) {
        console.error(error);
        alert('Error placing order');
    }
}

function initAdminProductsPage() {
    if (!token || !currentUser || currentUser.role !== 'admin') {
        alert('Access denied. Admins only.');
        window.location.href = 'index.html';
        return;
    }

    fetchAdminProducts();

    const createForm = document.getElementById('createProductForm');
    createForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(createForm);
        const data = {};
        formData.forEach((val, key) => {
            data[key] = val;
        });

        try {
            const res = await fetch(`${API_BASE}/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + token
                },
                body: JSON.stringify(data)
            });
            const respData = await res.json();
            if (res.ok) {
                alert('Product created');
                createForm.reset();
                fetchAdminProducts();
            } else {
                alert(respData.message || 'Error creating product');
            }
        } catch (err) {
            console.error(err);
            alert('Error creating product');
        }
    });

    const updateProductForm = document.getElementById('updateProductForm');
    updateProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(updateProductForm);
        const productId = formData.get('productId');

        const data = {};
        formData.forEach((val, key) => {
            if (key !== 'productId') {
                data[key] = val;
            }
        });
        try {
            const res = await fetch(`${API_BASE}/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + token
                },
                body: JSON.stringify(data)
            });
            const respData = await res.json();
            if (res.ok) {
                alert('Product updated');
                fetchAdminProducts();
                const modalEl = document.getElementById('updateModal');
                const modal = bootstrap.Modal.getInstance(modalEl);
                modal.hide();
            } else {
                alert(respData.message || 'Error updating product');
            }
        } catch (err) {
            console.error(err);
            alert('Error updating product');
        }
    });
}

async function fetchAdminProducts() {
    const container = document.getElementById('adminProductsContainer');
    container.innerHTML = 'Loading...';
    try {
        const res = await fetch(`${API_BASE}/products`, {
            headers: { Authorization: 'Bearer ' + token }
        });
        const products = await res.json();
        if (!Array.isArray(products)) {
            container.innerHTML = 'Error fetching products.';
            return;
        }
        container.innerHTML = '';
        products.forEach((p) => {
            const col = document.createElement('div');
            col.className = 'col-md-3 mb-3';

            const card = document.createElement('div');
            card.className = 'card';

            if (p.images && p.images.length > 0) {
                const img = document.createElement('img');
                img.src = p.images[0];
                img.className = 'card-img-top';
                card.appendChild(img);
            }

            const cardBody = document.createElement('div');
            cardBody.className = 'card-body';

            const catStr = (p.categories || []).join(', ');

            cardBody.innerHTML = `
        <h5 class="card-title">${p.name}</h5>
        <p class="card-text">Price: $${p.price}</p>
        <p class="card-text">Stock: ${p.stock}</p>
        <p class="card-text">Rating: ${p.rating}</p>
        <p class="card-text">Categories: ${catStr}</p>
        <p class="card-text text-truncate">${p.description}</p>
      `;

            const delBtn = document.createElement('button');
            delBtn.className = 'btn btn-danger me-2';
            delBtn.innerText = 'Delete';
            delBtn.onclick = () => deleteProduct(p._id);

            const updateBtn = document.createElement('button');
            updateBtn.className = 'btn btn-warning';
            updateBtn.innerText = 'Update';
            updateBtn.onclick = () => openUpdateModal(p);

            cardBody.appendChild(delBtn);
            cardBody.appendChild(updateBtn);
            card.appendChild(cardBody);
            col.appendChild(card);
            container.appendChild(col);
        });
    } catch (error) {
        console.error(error);
        container.innerHTML = 'Error fetching products.';
    }
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
        const res = await fetch(`${API_BASE}/products/${id}`, {
            method: 'DELETE',
            headers: { Authorization: 'Bearer ' + token }
        });
        const data = await res.json();
        if (res.ok) {
            alert('Product deleted');
            fetchAdminProducts();
        } else {
            alert(data.message || 'Error deleting product');
        }
    } catch (err) {
        console.error(err);
        alert('Error deleting product');
    }
}

function openUpdateModal(product) {
    document.getElementById('updateProductId').value = product._id;
    document.getElementById('updateName').value = product.name;
    document.getElementById('updatePrice').value = product.price;
    document.getElementById('updateDesc').value = product.description;
    document.getElementById('updateCategories').value = (product.categories || []).join(',');
    document.getElementById('updateStock').value = product.stock;
    document.getElementById('updateImages').value = (product.images || []).join(',');
    document.getElementById('updateRating').value = product.rating;

    const modalEl = document.getElementById('updateModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

function initAdminOrdersPage() {
    if (!token || !currentUser || currentUser.role !== 'admin') {
        alert('Access denied. Admins only.');
        window.location.href = 'index.html';
        return;
    }
    fetchAdminOrders();
}

async function fetchAdminOrders() {
    const container = document.getElementById('adminOrdersContainer');
    container.innerHTML = 'Loading...';
    try {
        const res = await fetch(`${API_BASE}/orders`, {
            headers: { Authorization: 'Bearer ' + token }
        });
        const orders = await res.json();
        if (!Array.isArray(orders)) {
            container.innerHTML = 'Error fetching orders.';
            return;
        }
        container.innerHTML = '';
        orders.forEach((o) => {
            const card = document.createElement('div');
            card.className = 'card mb-3 p-3';

            let productsHtml = '';
            o.products.forEach((op) => {
                productsHtml += `<li>${op.product?.name} x ${op.quantity}</li>`;
            });

            card.innerHTML = `
        <h5>Order ID: ${o._id}</h5>
        <p>User: ${o.user?.name} (${o.user?.email})</p>
        <p>Status: ${o.status}</p>
        <ul>${productsHtml}</ul>
        <p>Total Cost: $${o.totalCost}</p>
        <p>Creation time: $${o.createdAt}</p>

        <div>
          <button class="btn btn-sm btn-primary me-2" data-id="${o._id}" data-status="shipped">Mark Shipped</button>
          <button class="btn btn-sm btn-success" data-id="${o._id}" data-status="delivered">Mark Delivered</button>
        </div>
      `;
            container.appendChild(card);
        });

        container.querySelectorAll('button[data-id]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                const orderId = btn.getAttribute('data-id');
                const status = btn.getAttribute('data-status');
                await updateOrderStatus(orderId, status);
            });
        });
    } catch (error) {
        console.error(error);
        container.innerHTML = 'Error fetching orders.';
    }
}

async function updateOrderStatus(orderId, status) {
    try {
        const res = await fetch(`${API_BASE}/orders/${orderId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token
            },
            body: JSON.stringify({ status })
        });
        const data = await res.json();
        if (res.ok) {
            alert('Order status updated');
            fetchAdminOrders();
        } else {
            alert(data.message || 'Error updating order');
        }
    } catch (error) {
        console.error(error);
        alert('Error updating order');
    }
}
