// admin.js
const DEFAULT_USER = 'admin';
const DEFAULT_PASS_KEY = 'av_admin_pass_hash'; // store hashed password
const PRODUCTS_KEY = 'av_products';

const loginForm = document.getElementById('login-form');
const adminArea = document.getElementById('admin-area');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

const productForm = document.getElementById('product-form');
const pTitle = document.getElementById('p-title');
const pCategory = document.getElementById('p-category');
const pPrice = document.getElementById('p-price');
const pImage = document.getElementById('p-image');
const previewArea = document.getElementById('preview-area');
const previewImg = document.getElementById('preview-img');
const productList = document.getElementById('product-list');
const logoutBtn = document.getElementById('logout');
const exportBtn = document.getElementById('export-data');
const clearBtn = document.getElementById('clear-form');

let editingId = null;
let currentImageData = null;

// simple SHA-256 helper (returns hex)
async function sha256Hex(message){
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2,'0')).join('');
}

// ensure a password exists (first run)
(async function ensurePass(){
  if(!localStorage.getItem(DEFAULT_PASS_KEY)){
    const defaultPass = 'admin123';
    const h = await sha256Hex(defaultPass);
    localStorage.setItem(DEFAULT_PASS_KEY, h);
    console.info('Default admin password set to "admin123". Change it after login.');
  }
})();

// login handler
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const user = usernameInput.value.trim();
  const pass = passwordInput.value;
  const storedHash = localStorage.getItem(DEFAULT_PASS_KEY);
  const attemptHash = await sha256Hex(pass);
  if(user === DEFAULT_USER && attemptHash === storedHash){
    loginForm.classList.add('hidden');
    adminArea.classList.remove('hidden');
    loadProductList();
  } else {
    alert('Invalid credentials');
  }
});

// logout
logoutBtn.addEventListener('click', () => {
  adminArea.classList.add('hidden');
  loginForm.classList.remove('hidden');
  usernameInput.value = '';
  passwordInput.value = '';
});

// image preview
pImage.addEventListener('change', () => {
  const file = pImage.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    currentImageData = reader.result;
    previewImg.src = currentImageData;
    previewArea.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
});

// save product
productForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const products = loadProducts();
  const item = {
    id: editingId || Date.now().toString(),
    title: pTitle.value.trim(),
    category: pCategory.value,
    price: Number(pPrice.value).toFixed(2),
    image: currentImageData || null,
    published: true,
    createdAt: new Date().toISOString()
  };
  if(editingId){
    const idx = products.findIndex(p => p.id === editingId);
    if(idx >= 0) products[idx] = item;
  } else {
    products.unshift(item);
  }
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  resetForm();
  loadProductList();
  alert('Product saved');
});

// clear form
clearBtn.addEventListener('click', resetForm);

function resetForm(){
  editingId = null;
  pTitle.value = '';
  pCategory.value = 'wear';
  pPrice.value = '';
  pImage.value = '';
  currentImageData = null;
  previewArea.classList.add('hidden');
}

// load products
function loadProducts(){
  try { return JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]'); } catch(e){ return []; }
}

function loadProductList(){
  const products = loadProducts();
  productList.innerHTML = '';
  if(!products.length) productList.innerHTML = '<p class="muted">No products yet.</p>';
  products.forEach(p => {
    const div = document.createElement('div');
    div.className = 'product-item';
    div.innerHTML = `
      <img src="${p.image || 'assets/logo.png'}" alt="${escapeHtml(p.title)}" />
      <div class="meta">
        <div><strong>${escapeHtml(p.title)}</strong> <span class="muted">(${p.category})</span></div>
        <div class="muted">₦${Number(p.price).toFixed(2)}</div>
      </div>
      <div class="actions">
        <button class="btn ghost" data-action="edit" data-id="${p.id}">Edit</button>
        <button class="btn ghost" data-action="toggle" data-id="${p.id}">${p.published ? 'Unpublish' : 'Publish'}</button>
        <button class="btn ghost" data-action="delete" data-id="${p.id}">Delete</button>
      </div>
    `;
    productList.appendChild(div);
  });
}

// actions (edit/delete/toggle)
productList.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if(!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  let products = loadProducts();
  const idx = products.findIndex(p => p.id === id);
  if(idx < 0) return;
  if(action === 'delete'){
    if(!confirm('Delete this product?')) return;
    products.splice(idx,1);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    loadProductList();
  } else if(action === 'edit'){
    const p = products[idx];
    editingId = p.id;
    pTitle.value = p.title;
    pCategory.value = p.category;
    pPrice.value = p.price;
    if(p.image){
      currentImageData = p.image;
      previewImg.src = p.image;
      previewArea.classList.remove('hidden');
    } else {
      currentImageData = null;
      previewArea.classList.add('hidden');
    }
  } else if(action === 'toggle'){
    products[idx].published = !products[idx].published;
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    loadProductList();
  }
});

// export JSON
exportBtn.addEventListener('click', () => {
  const data = localStorage.getItem(PRODUCTS_KEY) || '[]';
  // show in a new tab for copy/paste
  const w = window.open('', '_blank');
  w.document.write('<pre>' + escapeHtml(data) + '</pre>');
});

// small helpers
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
