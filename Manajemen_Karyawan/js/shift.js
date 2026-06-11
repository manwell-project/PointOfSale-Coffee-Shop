document.addEventListener('DOMContentLoaded', () => {
  const employeeSelect = document.getElementById('employeeSelect');
  const openBtn = document.getElementById('openShiftBtn');
  const activeCard = document.getElementById('activeShiftCard');
  const activeInfo = document.getElementById('activeShiftInfo');
  const expectedCash = document.getElementById('expectedCash');
  const actualInput = document.getElementById('actualEndingCash');
  const notesInput = document.getElementById('shiftNotes');
  const closeBtn = document.getElementById('closeShiftBtn');
  const shiftList = document.getElementById('shiftList');

  async function loadEmployees() {
    try {
      const emps = await API.Employees.getAll();
      employeeSelect.innerHTML = emps.map(e => `<option value="${e.id}">${e.name} (${e.role || ''})</option>`).join('');
    } catch (err) {
      console.error(err);
    }
  }

  async function loadActiveShift() {
    try {
      const active = await API.apiFetch('/shifts/active');
      if (active && active.length) {
        const s = active[0];
        activeCard.style.display = 'block';
        activeInfo.innerHTML = `
          <div><strong>Shift ID:</strong> ${s.id}</div>
          <div><strong>Karyawan:</strong> ${s.employee_name} (ID ${s.employee_id})</div>
          <div><strong>Mulai:</strong> ${s.start_time}</div>
          <div><strong>Modal Awal:</strong> Rp ${s.starting_cash}</div>
        `;
        // expected cash will be computed by server when closing; show placeholder
        expectedCash.textContent = '- (akan dihitung saat tutup)';
        // store current active id for close
        closeBtn.dataset.shiftId = s.id;
      } else {
        activeCard.style.display = 'none';
        closeBtn.dataset.shiftId = '';
      }
    } catch (err) { console.error(err); }
  }

  async function loadShiftList() {
    try {
      const list = await API.apiFetch('/shifts');
      shiftList.innerHTML = list.map(s => `
        <div class="shift-item">
          <div><strong>#${s.id}</strong> ${s.employee_name} — ${s.status}</div>
          <div>Mulai: ${s.start_time} — Selesai: ${s.end_time || '-'}</div>
          <div>Modal: Rp ${s.starting_cash} | Expected: Rp ${s.expected_ending_cash || '-'} | Actual: Rp ${s.actual_ending_cash || '-'}</div>
        </div>
      `).join('');
    } catch (err) { console.error(err); }
  }

  openBtn.addEventListener('click', async () => {
    const employee_id = employeeSelect.value;
    const starting_cash = Number(document.getElementById('startingCash').value || 0);
    try {
      const created = await API.apiFetch('/shifts/open', { method: 'POST', body: JSON.stringify({ employee_id, starting_cash }) });
      showNotification('Shift dibuka');
      await loadActiveShift();
      await loadShiftList();
    } catch (err) { showNotification('Gagal buka shift: '+err.message, 'error'); }
  });

  closeBtn.addEventListener('click', async () => {
    const shift_id = Number(closeBtn.dataset.shiftId || 0);
    if (!shift_id) return showNotification('Tidak ada shift aktif', 'error');
    const actual_ending_cash = Number(actualInput.value || 0);
    const notes = notesInput.value || '';
    try {
      const res = await API.apiFetch('/shifts/close', { method: 'POST', body: JSON.stringify({ shift_id, actual_ending_cash, notes }) });
      showNotification('Shift ditutup');
      expectedCash.textContent = 'Rp ' + (res.expected_ending_cash || 0);
      await loadActiveShift();
      await loadShiftList();
    } catch (err) { showNotification('Gagal tutup shift: '+err.message, 'error'); }
  });

  // init
  loadEmployees();
  loadActiveShift();
  loadShiftList();
});
