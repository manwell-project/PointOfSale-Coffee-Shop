(function(){
  'use strict';

  // use same grid id as POS so existing CSS applies
  const menuListEl = document.getElementById('productGrid');
  const btnAdd = document.getElementById('btnAddProduct');
  const modal = document.getElementById('productModal');
  const modalTitle = document.getElementById('modalTitle');
  const productForm = document.getElementById('productForm');
  const btnCancel = document.getElementById('btnCancel');
  const searchInput = document.getElementById('searchInput');

  let products = [];

  function isValidImageUrl(url){
    if (!url) return false;
    if (typeof url !== 'string') return false;
    const trimmed = url.trim().toLowerCase();
    if (!trimmed) return false;
    if (trimmed === 'null' || trimmed === 'undefined') return false;
    return true;
  }

  function openModal(edit = false, product = null){
    modal.setAttribute('aria-hidden','false');
    modalTitle.textContent = edit ? 'Edit Menu' : 'Tambah Menu';
    document.getElementById('productId').value = product ? product.id : '';
    document.getElementById('productName').value = product ? product.name : '';
    document.getElementById('productCategory').value = product ? product.category : '';
    document.getElementById('productPrice').value = product ? product.price : '';
    document.getElementById('productDesc').value = product ? product.description : '';
    // setup image preview & controls
    const preview = document.getElementById('imagePreview');
    const removeBtn = document.getElementById('removeImageBtn');
    const uploadArea = document.getElementById('imageUploadArea');
    const input = document.getElementById('productImageInput');
    if (product && isValidImageUrl(product.image_url)) {
      preview.src = product.image_url;
      preview.style.display = 'block';
      removeBtn.style.display = 'inline-block';
      uploadArea.classList.add('has-image');
      preview.dataset.imgbase64 = '';
    } else {
      preview.src = '';
      preview.style.display = 'none';
      removeBtn.style.display = 'none';
      uploadArea.classList.remove('has-image');
      input.value = '';
      preview.dataset.imgbase64 = '';
    }
  }

  function closeModal(){
    modal.setAttribute('aria-hidden','true');
  }

  // close button inside modal (if present)
  const closeModalBtn = document.getElementById('closeModalBtn');
  if (closeModalBtn) closeModalBtn.addEventListener('click', ()=> closeModal());

  function renderList(list){
    menuListEl.innerHTML = '';
    if (!list || list.length === 0) {
      menuListEl.innerHTML = '<div style="grid-column:1/-1;padding:20px;color:#666">Tidak ada menu</div>';
      return;
    }

    list.forEach(p => {
      const card = document.createElement('div');
      card.className = 'product-card';
      // allow clicking on card to not add to cart; override pointer events on buttons
      card.innerHTML = `
        <div class="product-image-wrapper">
          ${isValidImageUrl(p.image_url) ? `<div class="product-image"><img src="${p.image_url}" alt="${escapeHtml(p.name)}" /></div>` : `<div class="product-image-placeholder"><i class="fas fa-utensils"></i></div>`}
        </div>
        <div class="product-info">
          <div class="product-name">${escapeHtml(p.name)}</div>
          <div class="product-price">${formatRupiah(p.price || 0)}</div>
          <div class="product-desc">${escapeHtml(p.description || '')}</div>
        </div>
        <div class="product-card-footer">
          <div style="display:flex;gap:8px;align-items:center;">
            <button class="btn btn-icon btn-edit" data-id="${p.id}" title="Edit"><i class="fas fa-pen"></i></button>
            <button class="btn btn-icon btn-delete" data-id="${p.id}" title="Hapus"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `;

      menuListEl.appendChild(card);
    });

    // attach listeners
    document.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', (e)=>{
      const id = e.currentTarget.dataset.id;
      const product = products.find(x=>String(x.id)===String(id));
      openModal(true, product);
    }));

    document.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', async (e)=>{
      const id = e.currentTarget.dataset.id;
      if (!confirm('Hapus menu ini?')) return;
      try {
        await window.API.Products.delete(id);
        showNotification('Menu dihapus', 'success');
        try { window.dispatchEvent(new Event('products-updated')); } catch (e) {}
        await loadProducts();
      } catch (err) {
        showNotification('Gagal menghapus: '+err.message,'error');
      }
    }));
  }

  async function loadProducts(){
    try {
      products = await window.API.Products.getAll();
      renderList(products);
    } catch (err) {
      menuListEl.innerHTML = `<div style="grid-column:1/-1;padding:20px;color:#f44336">Gagal memuat menu: ${escapeHtml(err.message)}</div>`;
    }
  }

  productForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const id = document.getElementById('productId').value;
    const payload = {
      name: document.getElementById('productName').value.trim(),
      category: document.getElementById('productCategory').value.trim(),
      price: Number(document.getElementById('productPrice').value) || 0,
      description: document.getElementById('productDesc').value.trim()
    };

    try {
      if (id) {
        await window.API.Products.update(id, payload);
        showNotification('Menu diperbarui', 'success');
        try { window.dispatchEvent(new Event('products-updated')); } catch (e) {}
        await maybeUploadImage(id);
      } else {
        const created = await window.API.Products.create(payload);
        showNotification('Menu dibuat', 'success');
        try { window.dispatchEvent(new Event('products-updated')); } catch (e) {}
        if (created && created.id) await maybeUploadImage(created.id);
      }

      closeModal();
      await loadProducts();
    } catch (err) {
      showNotification('Gagal menyimpan: '+err.message,'error');
    }
  });

  // Image upload helpers
  const imageInput = document.getElementById('productImageInput');
  const imagePreview = document.getElementById('imagePreview');
  const imageArea = document.getElementById('imageUploadArea');
  const removeImageBtn = document.getElementById('removeImageBtn');

  if (imageArea) {
    imageArea.addEventListener('click', ()=> imageInput && imageInput.click());
    imageArea.addEventListener('dragover', (e)=>{ e.preventDefault(); imageArea.classList.add('dragover'); });
    imageArea.addEventListener('dragleave', ()=>{ imageArea.classList.remove('dragover'); });
    imageArea.addEventListener('drop', (e)=>{
      e.preventDefault(); imageArea.classList.remove('dragover');
      const f = e.dataTransfer.files && e.dataTransfer.files[0];
      if (f && imageInput) handleImageFile({ target: { files: [f] } });
    });
  }

  if (imageInput) imageInput.addEventListener('change', handleImageFile);
  if (removeImageBtn) removeImageBtn.addEventListener('click', (ev)=>{
    ev.stopPropagation();
    if (imagePreview) { imagePreview.src = ''; imagePreview.style.display = 'none'; imagePreview.dataset.imgbase64 = ''; }
    if (removeImageBtn) removeImageBtn.style.display = 'none';
    if (imageArea) imageArea.classList.remove('has-image');
    if (imageInput) imageInput.value = '';
  });

  function handleImageFile(e){
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showNotification('Pilih file gambar', 'error'); return; }
    if (file.size > 2 * 1024 * 1024) { showNotification('Ukuran gambar maksimal 2MB', 'error'); return; }
    const reader = new FileReader();
    reader.onload = function(ev){
      if (imagePreview) { imagePreview.src = ev.target.result; imagePreview.style.display = 'block'; imagePreview.dataset.imgbase64 = ev.target.result; }
      if (removeImageBtn) removeImageBtn.style.display = 'inline-block';
      if (imageArea) imageArea.classList.add('has-image');
    };
    reader.readAsDataURL(file);
  }

  async function maybeUploadImage(productId){
    try {
      if (!imagePreview || !imagePreview.dataset) return;
      const dataUrl = imagePreview.dataset.imgbase64;
      if (!dataUrl) return;
      const res = await fetch(`/api/products/${productId}/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: dataUrl })
      });
      if (!res.ok) {
        const err = await res.json().catch(()=>({ error: res.statusText }));
        showNotification('Gagal upload gambar: '+(err.error||res.statusText),'error');
      } else {
        showNotification('Gambar diunggah', 'success');
      }
    } catch (err) {
      showNotification('Gagal upload gambar: '+err.message, 'error');
    }
  }

  btnCancel.addEventListener('click', ()=>closeModal());
  btnAdd.addEventListener('click', ()=> openModal(false,null));
  modal.addEventListener('click', (e)=>{ if (e.target===modal) closeModal(); });

  searchInput.addEventListener('input', (e)=>{
    const q = e.target.value.trim().toLowerCase();
    if (!q) return renderList(products);
    const filtered = products.filter(p => (p.name||'').toLowerCase().includes(q) || (p.category||'').toLowerCase().includes(q));
    renderList(filtered);
  });

  // initial load
  loadProducts();

  // helpers
  function escapeHtml(s){ if (!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function formatRupiah(amount){ return new Intl.NumberFormat('id-ID',{ style:'currency', currency:'IDR', minimumFractionDigits:0 }).format(amount); }

})();
