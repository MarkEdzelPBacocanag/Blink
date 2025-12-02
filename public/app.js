async function api(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error((await res.json()).error || 'Request failed')
  return res.json()
}

async function login(e) {
  e.preventDefault()
  const username = document.getElementById('username').value
  const password = document.getElementById('password').value
  try {
    await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) })
    window.location.href = '/dashboard.html'
  } catch (err) {
    alert('Login failed')
  }
}

async function logout() {
  await api('/api/auth/logout', { method: 'POST' })
  window.location.href = '/'
}

async function loadMe() {
  try {
    const { user } = await api('/api/me')
    const el = document.getElementById('user-info')
    if (el) el.textContent = `${user.username} (${user.role})`
    return user
  } catch (e) {
    window.location.href = '/'
  }
}

async function loadResidents() {
  const list = document.getElementById('residents-list')
  const rows = await api('/api/residents')
  list.innerHTML = rows.map(r => `<tr><td>${r.resident_ID}</td><td>${r.name}</td><td>${r.address}</td><td>${r.birth_Date}</td><td>${r.contact_Number}</td>
    <td><button onclick="editResident(${r.resident_ID}, '${r.name}', '${r.address}', '${r.birth_Date}', '${r.contact_Number}')">Edit</button></td></tr>`).join('')
}

async function addResident(e) {
  e.preventDefault()
  const name = document.getElementById('r-name').value
  const address = document.getElementById('r-address').value
  const birth_Date = document.getElementById('r-birth').value
  const contact_Number = document.getElementById('r-contact').value
  await api('/api/residents', { method: 'POST', body: JSON.stringify({ name, address, birth_Date, contact_Number }) })
  document.getElementById('resident-form').reset()
  loadResidents()
}

async function editResident(id, name, address, birth, contact) {
  document.getElementById('r-name').value = name
  document.getElementById('r-address').value = address
  document.getElementById('r-birth').value = birth
  document.getElementById('r-contact').value = contact
  const saveBtn = document.getElementById('resident-save')
  saveBtn.textContent = 'Update'
  saveBtn.onclick = async (e) => {
    e.preventDefault()
    const name = document.getElementById('r-name').value
    const address = document.getElementById('r-address').value
    const birth_Date = document.getElementById('r-birth').value
    const contact_Number = document.getElementById('r-contact').value
    await api(`/api/residents/${id}`, { method: 'PUT', body: JSON.stringify({ name, address, birth_Date, contact_Number }) })
    document.getElementById('resident-form').reset()
    saveBtn.textContent = 'Save'
    saveBtn.onclick = addResident
    loadResidents()
  }
}

async function loadServicesOptions() {
  const select = document.getElementById('req-service')
  const rows = await api('/api/services')
  select.innerHTML = rows.map(s => `<option value="${s.service_ID}">${s.service_Type}</option>`).join('')
}

async function loadServices() {
  const list = document.getElementById('services-list')
  if (!list) return
  const rows = await api('/api/services')
  list.innerHTML = rows.map(s => `<tr><td>${s.service_ID}</td><td>${s.service_Type}</td><td>${s.description||''}</td>
    <td><button onclick="editService(${s.service_ID}, '${s.service_Type}', '${s.description||''}')">Edit</button></td>
    <td><button onclick="deleteService(${s.service_ID})">Delete</button></td></tr>`).join('')
}

async function addService(e) {
  e.preventDefault()
  const service_Type = document.getElementById('s-type').value
  const description = document.getElementById('s-desc').value
  await api('/api/services', { method: 'POST', body: JSON.stringify({ service_Type, description }) })
  document.getElementById('service-form').reset()
  loadServices()
}

async function editService(id, type, desc) {
  document.getElementById('s-type').value = type
  document.getElementById('s-desc').value = desc
  const save = document.getElementById('service-save')
  save.textContent = 'Update'
  save.onclick = async (e) => {
    e.preventDefault()
    const service_Type = document.getElementById('s-type').value
    const description = document.getElementById('s-desc').value
    await api(`/api/services/${id}`, { method: 'PUT', body: JSON.stringify({ service_Type, description }) })
    document.getElementById('service-form').reset()
    save.textContent = 'Save'
    save.onclick = addService
    loadServices()
  }
}

async function deleteService(id) {
  try {
    await api(`/api/services/${id}`, { method: 'DELETE' })
    loadServices()
  } catch (e) {
    alert('Admin only')
  }
}

async function loadResidentsOptions() {
  const select = document.getElementById('req-resident')
  const rows = await api('/api/residents')
  select.innerHTML = rows.map(r => `<option value="${r.resident_ID}">${r.name}</option>`).join('')
}

async function loadStaffs() {
  const list = document.getElementById('staffs-list')
  if (!list) return
  const rows = await api('/api/staffs')
  list.innerHTML = rows.map(s => `<tr><td>${s.staff_ID}</td><td>${s.name}</td><td>${s.role}</td>
    <td><button onclick="editStaff(${s.staff_ID}, '${s.name}', '${s.role}')">Edit</button></td>
    <td><button onclick="deleteStaff(${s.staff_ID})">Delete</button></td></tr>`).join('')
}

async function addStaff(e) {
  e.preventDefault()
  const name = document.getElementById('st-name').value
  const role = document.getElementById('st-role').value
  await api('/api/staffs', { method: 'POST', body: JSON.stringify({ name, role }) })
  document.getElementById('staff-form').reset()
  loadStaffs()
}

async function editStaff(id, name, role) {
  document.getElementById('st-name').value = name
  document.getElementById('st-role').value = role
  const save = document.getElementById('staff-save')
  save.textContent = 'Update'
  save.onclick = async (e) => {
    e.preventDefault()
    const name = document.getElementById('st-name').value
    const role = document.getElementById('st-role').value
    await api(`/api/staffs/${id}`, { method: 'PUT', body: JSON.stringify({ name, role }) })
    document.getElementById('staff-form').reset()
    save.textContent = 'Save'
    save.onclick = addStaff
    loadStaffs()
  }
}

async function deleteStaff(id) {
  try {
    await api(`/api/staffs/${id}`, { method: 'DELETE' })
    loadStaffs()
  } catch (e) {
    alert('Admin only or staff has assignments')
  }
}

async function loadRequests() {
  const list = document.getElementById('requests-list')
  const rows = await api('/api/requests')
  list.innerHTML = rows.map(r => `<tr><td>${r.request_ID}</td><td>${r.resident_name}</td><td>${r.service_Type}</td><td>${r.date_Requested}</td><td>${r.status}</td>
  <td><select onchange="updateStatus(${r.request_ID}, this.value)"><option ${r.status==='Pending'?'selected':''}>Pending</option><option ${r.status==='In Progress'?'selected':''}>In Progress</option><option ${r.status==='Completed'?'selected':''}>Completed</option></select></td></tr>`).join('')
}

async function addRequest(e) {
  e.preventDefault()
  const resident_ID = Number(document.getElementById('req-resident').value)
  const service_ID = Number(document.getElementById('req-service').value)
  const date_Requested = document.getElementById('req-date').value
  const status = document.getElementById('req-status').value
  await api('/api/requests', { method: 'POST', body: JSON.stringify({ resident_ID, service_ID, date_Requested, status }) })
  document.getElementById('request-form').reset()
  loadRequests()
}

async function updateStatus(id, status) {
  try {
    await api(`/api/requests/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) })
  } catch (e) {
    alert('Only staff/admin can update status')
  }
}

async function loadSummary() {
  const res = await api('/api/reports/summary')
  document.getElementById('total-requests').textContent = res.total_requests
  document.getElementById('completed-requests').textContent = res.completed_requests
}

window.BarangayLink = {
  login,
  logout,
  loadMe,
  loadResidents,
  addResident,
  loadServicesOptions,
  loadServices,
  loadResidentsOptions,
  loadStaffs,
  addStaff,
  editStaff,
  deleteStaff,
  loadRequests,
  addRequest,
  updateStatus,
  loadSummary,
  addService,
  editService,
  deleteService,
}

