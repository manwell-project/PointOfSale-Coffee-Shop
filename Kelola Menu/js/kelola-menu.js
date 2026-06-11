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
    document.getElementById('productBarcode').value = product ? product.barcode : '';
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
      card.style.cssText = 'display: flex; flex-direction: column; height: 100%; border: 1px solid #e2d5cc; border-top: 4px solid var(--color-primary); box-shadow: 0 4px 12px rgba(139, 90, 43, 0.08); border-radius: 12px; overflow: hidden; background: #fff; transition: transform 0.2s ease, box-shadow 0.2s ease;';
      card.onmouseenter = () => { card.style.transform = 'translateY(-4px)'; card.style.boxShadow = '0 8px 16px rgba(139, 90, 43, 0.15)'; };
      card.onmouseleave = () => { card.style.transform = 'translateY(0)'; card.style.boxShadow = '0 4px 12px rgba(139, 90, 43, 0.08)'; };
      
      card.innerHTML = `
        <div class="product-image-wrapper" style="margin-bottom: 0; border-radius: 12px 12px 0 0; border-bottom: 1px solid #f0e6e0;">
          ${isValidImageUrl(p.image_url) 
            ? `<div class="product-image"><img src="${p.image_url}" alt="${escapeHtml(p.name)}" /></div>` 
            : `<div class="product-image-placeholder"><i class="fas fa-coffee"></i></div>`}
          <span style="position: absolute; top: 12px; right: 12px; background: rgba(139, 90, 43, 0.9); color: white; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); z-index: 2;">${escapeHtml(p.category || 'Menu')}</span>
        </div>
        <div class="product-info" style="padding: 16px; flex-grow: 1; display: flex; flex-direction: column;">
          <div class="product-name" style="font-size: 1.15rem; font-weight: 700; color: #4a3b32; margin-bottom: 8px;">${escapeHtml(p.name)}</div>
          <div class="product-price" style="font-size: 1.25rem; font-weight: 800; color: var(--color-primary); margin-bottom: 12px;">${formatRupiah(p.price || 0)}</div>
          <div class="product-desc" style="font-size: 0.85rem; color: #6b5c53; flex-grow: 1; margin-bottom: 12px; line-height: 1.5;">${escapeHtml(p.description || 'Tidak ada keterangan.')}</div>
          ${p.barcode ? `<div style="font-size: 0.8rem; color: #8c7a6b; display: flex; align-items: center; gap: 6px; padding: 6px 8px; background: #f9f5f2; border-radius: 6px; border: 1px dashed #d7c9bf;"><i class="fas fa-barcode"></i> ${escapeHtml(p.barcode)}</div>` : ''}
        </div>
        <div class="product-card-footer" style="padding: 12px 16px; background: #faf6f3; border-top: 1px solid #f0e6e0; display: flex; justify-content: flex-end; gap: 8px;">
          <button class="btn-edit" data-id="${p.id}" title="Edit" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; background: white; border: 1px solid var(--color-primary); color: var(--color-primary); padding: 8px 12px; border-radius: 6px; cursor: pointer; transition: all 0.2s; font-weight: 600;"><i class="fas fa-pen"></i> Edit</button>
          <button class="btn-delete" data-id="${p.id}" title="Hapus" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; background: white; border: 1px solid #e74c3c; color: #e74c3c; padding: 8px 12px; border-radius: 6px; cursor: pointer; transition: all 0.2s; font-weight: 600;"><i class="fas fa-trash"></i> Hapus</button>
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
      description: document.getElementById('productDesc').value.trim(),
      barcode: document.getElementById('productBarcode').value.trim() || null
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
