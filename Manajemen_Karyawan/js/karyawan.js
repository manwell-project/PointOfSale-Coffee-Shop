// Simple client-side CRUD for employees

let employees = [];

const container = document.getElementById('employees-container');
const listMount = document.getElementById('employeeList');
const addBtn = document.getElementById('addEmployeeBtn');
const modal = document.getElementById('employeeModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const saveBtn = document.getElementById('saveBtn');
const modalTitle = document.getElementById('modalTitle');
let editingId = null;
let currentFilter = 'all';
const searchInput = document.getElementById('searchInputEmp');
const tabs = document.querySelectorAll('.tab-item');
const filterShift = document.getElementById('filterShift');
const filterStatus = document.getElementById('filterStatus');

const totalEmployeesEl = document.getElementById('totalEmployees');
const activeEmployeesEl = document.getElementById('activeEmployees');
const shiftPagiEl = document.getElementById('shiftPagiCount');
const shiftSiangEl = document.getElementById('shiftSiangCount');

// Badge elements
const badgeAll = document.getElementById('badgeAll');
const badgePagi = document.getElementById('badgePagi');
const badgeSiang = document.getElementById('badgeSiang');
const badgeFullTime = document.getElementById('badgeFullTime');


async function renderEmployees(){
  try {
    // Ambil data dari API
    employees = await window.API.Employees.getAll();
    
    // filter by tab and search
    const searchTerm = (searchInput && searchInput.value) ? searchInput.value.toLowerCase() : '';
    const shiftFilter = filterShift ? filterShift.value : '';
    const statusFilter = filterStatus ? filterStatus.value : '';
    
    const filtered = employees.filter(emp => {
      if(currentFilter !== 'all' && emp.shift !== currentFilter) return false;
      if(shiftFilter && emp.shift !== shiftFilter) return false;
      if(statusFilter && (emp.status || 'active') !== statusFilter) return false;
      if(searchTerm){
        return emp.name.toLowerCase().includes(searchTerm) || 
               (emp.position || '').toLowerCase().includes(searchTerm) ||
               (emp.email || '').toLowerCase().includes(searchTerm) || 
               (emp.phone || '').includes(searchTerm);
      }
      return true;
    });

    // update stats
    const pagiCount = employees.filter(e=>e.shift==='Pagi').length;
    const siangCount = employees.filter(e=>e.shift==='Siang').length;
    const fullTimeCount = employees.filter(e=>e.shift==='Full Time').length;
    const activeCount = employees.filter(e=>(e.status || 'active')==='active').length;
    
    if(totalEmployeesEl) totalEmployeesEl.textContent = employees.length;
    if(activeEmployeesEl) activeEmployeesEl.textContent = activeCount;
    if(shiftPagiEl) shiftPagiEl.textContent = pagiCount;
    if(shiftSiangEl) shiftSiangEl.textContent = siangCount;
    
    // update badges
    if(badgeAll) badgeAll.textContent = employees.length;
    if(badgePagi) badgePagi.textContent = pagiCount;
    if(badgeSiang) badgeSiang.textContent = siangCount;
    if(badgeFullTime) badgeFullTime.textContent = fullTimeCount;

    // render
    if(!listMount) return;
    listMount.innerHTML = '';
    if(filtered.length === 0){
      listMount.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-users empty-icon"></i>
          <h3 class="empty-title">Tidak Ada Karyawan</h3>
          <p class="empty-text">Belum ada data karyawan yang tersedia</p>
        </div>
      `;
      return;
    }
    filtered.sort((a,b)=>a.name.localeCompare(b.name));
    filtered.forEach(emp=>{
      const el = document.createElement('div');
      el.className = 'employee-card';
      const initials = emp.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
      const statusBadge = (emp.status || 'active') === 'active' ? 'active' : emp.status === 'inactive' ? 'inactive' : 'on-leave';
      const shiftBadge = emp.shift === 'Pagi' ? 'shift-morning' : emp.shift === 'Siang' ? 'shift-day' : 'shift-full';
      const statusText = (emp.status || 'active') === 'active' ? 'Aktif' : emp.status === 'inactive' ? 'Tidak Aktif' : 'Cuti';
      
      el.innerHTML = `
        <div class="employee-card-header">
          <div class="employee-avatar">${initials}</div>
          <div class="employee-info">
            <h3 class="employee-name">${emp.name}</h3>
            <p class="employee-position">
              <i class="fas fa-briefcase"></i>
              ${emp.position || 'Staff'}
            </p>
            <p class="employee-id">ID: ${emp.id || 'N/A'}</p>
          </div>
          <div class="employee-card-actions">
            <button class="btn-card-action edit" data-id="${emp.id}" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-card-action delete" data-id="${emp.id}" title="Hapus">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="employee-details">
          <div class="detail-item">
            <span class="detail-label">Shift</span>
            <span class="detail-value">${emp.shift || 'N/A'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Status</span>
            <span class="detail-value">${statusText}</span>
          </div>
        </div>
        <div class="status-badges">
          <span class="status-badge ${shiftBadge}">
            <i class="fas fa-clock"></i>
            ${emp.shift || 'N/A'}
          </span>
          <span class="status-badge ${statusBadge}">
            <i class="fas fa-circle"></i>
            ${statusText}
          </span>
        </div>
        <div class="contact-info">
          <div class="contact-item">
            <i class="fas fa-phone"></i>
            <span>${emp.phone || 'N/A'}</span>
          </div>
          <div class="contact-item">
            <i class="fas fa-envelope"></i>
            <a href="mailto:${emp.email || '#'}">${emp.email || 'N/A'}</a>
          </div>
        </div>
      `;
      listMount.appendChild(el);
    });
    attachListeners();
  } catch (err) {
    if(listMount) listMount.innerHTML = `<div class='empty-state'><i class="fas fa-exclamation-circle empty-icon"></i><h3 class="empty-title">Gagal memuat data karyawan</h3><p class="empty-text">${err.message}</p></div>`;
  }
}

function attachListeners(){
  document.querySelectorAll('.btn-card-action.edit').forEach(b=>b.addEventListener('click',e=>{
    e.stopPropagation();
    const id = parseInt(e.currentTarget.dataset.id);
    openEdit(id);
  }));
  document.querySelectorAll('.btn-card-action.delete').forEach(b=>b.addEventListener('click',e=>{
    e.stopPropagation();
    const id = parseInt(e.currentTarget.dataset.id);
    deleteEmployee(id);
  }));
}

function openAdd(){
  editingId = null;
  document.getElementById('employeeId').value = '';
  document.getElementById('employeeName').value = '';
  document.getElementById('employeePosition').value = '';
  document.getElementById('employeeEmail').value = '';
  document.getElementById('employeePhone').value = '';
  document.getElementById('employeeAddress').value = '';
  document.getElementById('employeeJoinDate').value = '';
  document.getElementById('employeeShift').value = '';
  document.getElementById('employeeStatus').value = 'active';
  document.getElementById('employeeNotes').value = '';
  
  // Reset photo
  const photoPreview = document.getElementById('photoPreview');
  const removePhotoBtn = document.getElementById('removePhotoBtn');
  if(photoPreview) photoPreview.innerHTML = '<i class="fas fa-user photo-placeholder"></i>';
  if(removePhotoBtn) removePhotoBtn.style.display = 'none';
  
  if(modalTitle) modalTitle.innerHTML = '<i class="fas fa-user-plus"></i> Tambah Karyawan Baru';
  if(saveBtn) saveBtn.innerHTML = '<i class="fas fa-check"></i> Simpan Karyawan';
  if(modal) modal.classList.add('active');
}

function openEdit(id){
  const emp = employees.find(e=>e.id===id);
  if(!emp) return;
  editingId = id;
  document.getElementById('employeeId').value = emp.id;
  document.getElementById('employeeName').value = emp.name || '';
  document.getElementById('employeePosition').value = emp.position || '';
  document.getElementById('employeeEmail').value = emp.email || '';
  document.getElementById('employeePhone').value = emp.phone || '';
  document.getElementById('employeeAddress').value = emp.address || '';
  document.getElementById('employeeJoinDate').value = emp.joinDate || '';
  document.getElementById('employeeShift').value = emp.shift || '';
  document.getElementById('employeeStatus').value = emp.status || 'active';
  document.getElementById('employeeNotes').value = emp.notes || '';
  
  if(modalTitle) modalTitle.innerHTML = '<i class="fas fa-user-edit"></i> Edit Karyawan';
  if(saveBtn) saveBtn.innerHTML = '<i class="fas fa-check"></i> Update Karyawan';
  if(modal) modal.classList.add('active');
}


async function saveEmployee(e){
  e.preventDefault();
  const name = document.getElementById('employeeName').value.trim();
  const position = document.getElementById('employeePosition').value;
  const email = document.getElementById('employeeEmail').value.trim();
  const phone = document.getElementById('employeePhone').value.trim();
  const address = document.getElementById('employeeAddress').value.trim();
  const joinDate = document.getElementById('employeeJoinDate').value;
  const shift = document.getElementById('employeeShift').value;
  const status = document.getElementById('employeeStatus').value;
  const notes = document.getElementById('employeeNotes').value.trim();
  
  if(!name || !phone || !shift) { 
    window.showNotification('Nama, telepon, dan shift harus diisi', 'error'); 
    return; 
  }
  
  const employeeData = {
    name, 
    position,
    email, 
    phone, 
    address,
    joinDate,
    shift, 
    status,
    notes
  };
  
  try {
    if(saveBtn) saveBtn.classList.add('loading');
    
    if(editingId){
      await window.API.Employees.update(editingId, employeeData);
      window.showNotification('Karyawan berhasil diperbarui!','success');
    } else {
      await window.API.Employees.create(employeeData);
      window.showNotification('Karyawan berhasil ditambahkan!','success');
    }
    
    if(modal) modal.classList.remove('active');
    renderEmployees();
  } catch (err) {
    window.showNotification('Gagal menyimpan data: '+err.message, 'error');
  } finally {
    if(saveBtn) saveBtn.classList.remove('loading');
  }
}


async function deleteEmployee(id){
  if(!confirm('Hapus karyawan ini?')) return;
  try {
    await window.API.Employees.delete(id);
    window.showNotification('Karyawan berhasil dihapus!','success');
    renderEmployees();
  } catch (err) {
    window.showNotification('Gagal menghapus: '+err.message, 'error');
  }
}

// Wire UI elements
if(addBtn) addBtn.addEventListener('click', openAdd);

if(closeModalBtn) closeModalBtn.addEventListener('click', ()=>{ 
  if(modal) modal.classList.remove('active'); 
  editingId = null;
});

if(cancelBtn) cancelBtn.addEventListener('click', ()=>{ 
  if(modal) modal.classList.remove('active'); 
  editingId = null;
});

// Close modal when clicking outside
if(modal) { 
  modal.addEventListener('click', (e)=>{ 
    if(e.target === modal) {
      modal.classList.remove('active');
      editingId = null;
    }
  }); 
}

const employeeForm = document.getElementById('employeeForm');
if(employeeForm) employeeForm.addEventListener('submit', saveEmployee);

// Photo upload handlers
const uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
const photoInput = document.getElementById('photoInput');
const removePhotoBtn = document.getElementById('removePhotoBtn');
const photoPreview = document.getElementById('photoPreview');

if(uploadPhotoBtn && photoInput) {
  uploadPhotoBtn.addEventListener('click', () => photoInput.click());
  
  photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(file && file.type.startsWith('image/')) {
      if(file.size > 2 * 1024 * 1024) {
        window.showNotification('Ukuran file maksimal 2MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        photoPreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        if(removePhotoBtn) removePhotoBtn.style.display = 'flex';
      };
      reader.readAsDataURL(file);
    }
  });
}

if(removePhotoBtn) {
  removePhotoBtn.addEventListener('click', () => {
    photoPreview.innerHTML = '<i class="fas fa-user photo-placeholder"></i>';
    if(photoInput) photoInput.value = '';
    removePhotoBtn.style.display = 'none';
  });
}

// Initial render
renderEmployees();

// Search and tabs
if(searchInput) searchInput.addEventListener('input', ()=>{ renderEmployees(); });

if(filterShift) filterShift.addEventListener('change', ()=>{ renderEmployees(); });
if(filterStatus) filterStatus.addEventListener('change', ()=>{ renderEmployees(); });

tabs.forEach(t=>t.addEventListener('click', (e)=>{
  tabs.forEach(x=>x.classList.remove('active'));
  t.classList.add('active');
  currentFilter = t.getAttribute('data-filter');
  renderEmployees();
}));
