// Simple client-side CRUD for employees

let employees = [];

const container = document.getElementById('employees-container');
const listMount = document.getElementById('employeeList');
const addBtn = document.querySelector('.add-employee-btn');
const modal = document.getElementById('employeeModal');
const formCard = document.querySelector('.employee-form'); // legacy fallback
const saveBtn = document.getElementById('save-btn-text');
let editingId = null;
let currentFilter = 'all';
const searchInput = document.getElementById('searchInputEmp');
const tabs = document.querySelectorAll('.tab');

const totalEmployeesEl = document.getElementById('totalEmployees');
const shiftPagiEl = document.getElementById('shiftPagiCount');
const shiftSiangEl = document.getElementById('shiftSiangCount');


async function renderEmployees(){
  try {
    // Ambil data dari API
    employees = await window.API.Employees.getAll();
    // filter by tab and search
    const searchTerm = (searchInput && searchInput.value) ? searchInput.value.toLowerCase() : '';
    const filtered = employees.filter(emp => {
      if(currentFilter !== 'all' && emp.shift !== currentFilter) return false;
      if(searchTerm){
        return emp.name.toLowerCase().includes(searchTerm) || (emp.email||'').toLowerCase().includes(searchTerm) || (emp.phone||'').includes(searchTerm);
      }
      return true;
    });

    // update stats
    if(totalEmployeesEl) totalEmployeesEl.textContent = employees.length;
    if(shiftPagiEl) shiftPagiEl.textContent = employees.filter(e=>e.shift==='Pagi').length;
    if(shiftSiangEl) shiftSiangEl.textContent = employees.filter(e=>e.shift!=='Pagi').length;

    // render
    if(!listMount) return;
    listMount.innerHTML = '';
    if(filtered.length === 0){
      listMount.innerHTML = '<div class="empty-state">Tidak ada karyawan</div>';
      return;
    }
    filtered.sort((a,b)=>a.name.localeCompare(b.name));
    filtered.forEach(emp=>{
      const el = document.createElement('div');
      el.className = 'employee-card';
      const initials = emp.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
      el.innerHTML = `
        <div class="employee-avatar">${initials}</div>
        <div class="employee-info">
          <div class="employee-name">${emp.name}</div>
          <div class="employee-details">${emp.phone||''} • ${emp.shift||''} • ${emp.email||''}</div>
        </div>
        <div class="employee-actions">
          <button class="action-btn edit-btn" data-id="${emp.id}" title="Edit"><i class="fas fa-edit"></i></button>
          <button class="action-btn delete-btn" data-id="${emp.id}" title="Hapus"><i class="fas fa-trash"></i></button>
        </div>
      `;
      listMount.appendChild(el);
    });
    attachListeners();
  } catch (err) {
    if(listMount) listMount.innerHTML = `<div class='empty-state'>Gagal memuat data karyawan<br>${err.message}</div>`;
  }
}

function attachListeners(){
  document.querySelectorAll('.edit-btn').forEach(b=>b.addEventListener('click',e=>{
    const id = parseInt(e.currentTarget.dataset.id);
    openEdit(id);
  }));
  document.querySelectorAll('.delete-btn').forEach(b=>b.addEventListener('click',e=>{
    const id = parseInt(e.currentTarget.dataset.id);
    deleteEmployee(id);
  }));
}

function openAdd(){
  editingId = null;
  document.getElementById('employeeId').value = '';
  document.getElementById('employee-name').value = '';
  document.getElementById('employee-shift').value = '';
  document.getElementById('employee-phone').value = '';
  document.getElementById('employee-email').value = '';
  if(modal){ modal.setAttribute('aria-hidden','false'); }
  if(formCard) formCard.style.display = 'block';
  saveBtn.textContent = 'Simpan';
}

function openEdit(id){
  const emp = employees.find(e=>e.id===id);
  if(!emp) return;
  editingId = id;
  document.getElementById('employeeId').value = emp.id;
  document.getElementById('employee-name').value = emp.name;
  document.getElementById('employee-shift').value = emp.shift;
  document.getElementById('employee-phone').value = emp.phone;
  document.getElementById('employee-email').value = emp.email;
  if(modal){ modal.setAttribute('aria-hidden','false'); }
  if(formCard) formCard.style.display = 'block';
  saveBtn.textContent = 'Perbarui';
}


async function saveEmployee(e){
  e.preventDefault();
  const idField = document.getElementById('employeeId');
  const name = document.getElementById('employee-name').value.trim();
  const shift = document.getElementById('employee-shift').value;
  const phone = document.getElementById('employee-phone').value.trim();
  const email = document.getElementById('employee-email').value.trim();
  if(!name || !phone) { window.showNotification('Nama dan telepon harus diisi', 'error'); return; }
  try {
    if(editingId){
      await window.API.Employees.update(editingId, { name, shift, phone, email });
      window.showNotification('Karyawan berhasil diperbarui!','success');
    } else {
      await window.API.Employees.create({ name, shift, phone, email });
      window.showNotification('Karyawan berhasil ditambahkan!','success');
    }
    if(modal) modal.setAttribute('aria-hidden','true');
    if(formCard) formCard.style.display = 'none';
    renderEmployees();
  } catch (err) {
    window.showNotification('Gagal menyimpan data: '+err.message, 'error');
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

function showDetail(id){
  const emp = employees.find(e=>e.id===id);
  if(!emp) return;alert(`${emp.name}\nShift: ${emp.shift}\nEmail: ${emp.email}\nPhone: ${emp.phone}`);
}

// Wire UI elements
if(addBtn) addBtn.addEventListener('click',openAdd);
const cancelBtn = document.querySelector('.cancel-btn');
if(cancelBtn) cancelBtn.addEventListener('click',()=>{ if(modal) modal.setAttribute('aria-hidden','true'); if(formCard) formCard.style.display='none'; editingId=null});
const modalClose = document.querySelectorAll('.modal-close');
modalClose.forEach(b=>b.addEventListener('click',()=>{ if(modal) modal.setAttribute('aria-hidden','true'); }));
// close modal when clicking outside content
if(modal){ modal.addEventListener('click', (e)=>{ if(e.target===modal) modal.setAttribute('aria-hidden','true'); }); }
const customerForm = document.getElementById('employeeForm');
if(customerForm) customerForm.addEventListener('submit',saveEmployee);

// Initial render
renderEmployees();

// search and tabs
if(searchInput) searchInput.addEventListener('input', ()=>{ renderEmployees(); });
tabs.forEach(t=>t.addEventListener('click', (e)=>{
  tabs.forEach(x=>x.classList.remove('active'));
  t.classList.add('active');
  currentFilter = t.getAttribute('data-filter');
  renderEmployees();
}));
