// main.js
document.getElementById('year').textContent = new Date().getFullYear();

// hide intro after animation
window.addEventListener('load', () => {
  setTimeout(() => {
    const intro = document.getElementById('intro');
    intro.style.opacity = '0';
    intro.style.transform = 'translateY(-10px)';
    setTimeout(()=> intro.remove(), 700);
  }, 1800);
});

// load products from localStorage
function loadProducts(){
  const raw = localStorage.getItem('av_products');
  if(!raw) return [];
  try { return JSON.parse(raw); } catch(e){ return []; }
}

function render(){
  const products = loadProducts();
  const wearsGrid = document.getElementById('wears-grid');
  const drinksGrid = document.getElementById('drinks-grid');
  wearsGrid.innerHTML = '';
  drinksGrid.innerHTML = '';

  products.filter(p => p.published).forEach(p => {
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `
      <img src="${p.image || 'assets/logo.png'}" alt="${escapeHtml(p.title)}" />
      <h3>${escapeHtml(p.title)}</h3>
      <p class="muted">${p.category === 'drink' ? 'Drink' : 'Wear'}</p>
      <div class="price">₦${Number(p.price).toFixed(2)}</div>
    `;
    if(p.category === 'drink') drinksGrid.appendChild(el);
    else wearsGrid.appendChild(el);
  });

  // show placeholders if empty
  if(!wearsGrid.children.length) wearsGrid.innerHTML = '<p class="muted">No wears yet. Check back soon.</p>';
  if(!drinksGrid.children.length) drinksGrid.innerHTML = '<p class="muted">No drinks yet. Check back soon.</p>';
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

render();
