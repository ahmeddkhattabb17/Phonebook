let contacts = JSON.parse(localStorage.getItem('ch_contacts') || '[]');
let editingId = null;
let photoDataUrl = null;

const modal = new bootstrap.Modal(document.getElementById('contactModal'));

const COLORS = ['#3b82f6','#8b5cf6','#ec4899','#06b6d4','#10b981','#f59e0b','#ef4444','#6366f1'];

function getInitials(name) {
  return name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
}

function getColor(name) {
  let h = 0;
  for (let c of name) h = (h * 31 + c.charCodeAt(0)) % COLORS.length;
  return COLORS[h];
}

function save() {
  localStorage.setItem('ch_contacts', JSON.stringify(contacts));
  renderAll();
}

function renderAll() {
  renderContacts();
  renderSidebar();
  updateStats();
}

function updateStats() {
  document.getElementById('stat-total').textContent = contacts.length;
  document.getElementById('stat-fav').textContent   = contacts.filter(c=>c.fav).length;
  document.getElementById('stat-emer').textContent  = contacts.filter(c=>c.emer).length;
}

function renderContacts() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const list = document.getElementById('contacts-list');
  const sub  = document.getElementById('contacts-subtitle');

  let filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(q) ||
    (c.phone||'').includes(q) ||
    (c.email||'').toLowerCase().includes(q)
  );

  sub.textContent = `Manage and organize your ${contacts.length} contact${contacts.length!==1?'s':''}`;

  if (!filtered.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon mx-auto"><i class="bi bi-person-x"></i></div>
        <p class="fw-bold mb-1" style="font-size:16px">${q ? 'No results found' : 'No contacts found'}</p>
        <p class="text-muted" style="font-size:13px">${q ? 'Try a different search term' : 'Click "Add Contact" to get started'}</p>
      </div>`;
    return;
  }

  list.innerHTML = `<div class="row g-3">${filtered.map(c => contactCard(c)).join('')}</div>`;
}

function contactCard(c) {
  const initials = getInitials(c.name);
  const color    = getColor(c.name);
  const avatarHtml = c.photo
    ? `<img src="${c.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:14px;"/>`
    : initials;

  const badges = (c.fav  ? `<div class="badge-fav"><i class="bi bi-star-fill" style="font-size:9px;"></i></div>` : '') +
                 (c.emer ? `<div class="badge-emer"><i class="bi bi-heart-pulse-fill" style="font-size:9px;"></i></div>` : '');

  const emailRow   = c.email   ? `<div class="contact-detail mt-1"><div class="icon-circle email"><i class="bi bi-envelope-fill"></i></div>${c.email}</div>` : '';
  const addressRow = c.address ? `<div class="contact-detail mt-1"><div class="icon-circle addr"><i class="bi bi-geo-alt-fill"></i></div>${c.address}</div>` : '';
  const emerTag    = c.emer    ? `<div class="mt-2"><span class="tag-emergency"><i class="bi bi-heart-pulse-fill"></i> Emergency</span></div>` : '';

  return `
    <div class="col-md-6 col-lg-6">
      <div class="contact-card">
        <div class="d-flex align-items-start gap-3 mb-2">
          <div class="contact-avatar" style="background:${color}">${avatarHtml}${badges}</div>
          <div style="flex:1;min-width:0;">
            <div class="contact-name">${c.name}</div>
            <div class="contact-detail mt-1"><div class="icon-circle phone"><i class="bi bi-telephone-fill"></i></div>${c.phone}</div>
            ${emailRow}${addressRow}${emerTag}
          </div>
        </div>
        <div class="d-flex align-items-center mt-2">
          <a href="tel:${c.phone}" class="action-btn call" title="Call"><i class="bi bi-telephone-fill"></i></a>
          ${c.email ? `<a href="mailto:${c.email}" class="action-btn mail" title="Email"><i class="bi bi-envelope-fill"></i></a>` : ''}
          <div class="ms-auto d-flex gap-1">
            <button class="action-btn fav" onclick="toggleFav('${c.id}')" title="${c.fav?'Remove favorite':'Add favorite'}">
              <i class="bi bi-star${c.fav?'-fill':''}"></i>
            </button>
            <button class="action-btn emer" onclick="toggleEmer('${c.id}')" title="Emergency">
              <i class="bi bi-heart${c.emer?'-pulse-fill':''}"></i>
            </button>
            <button class="action-btn edit" onclick="openEditModal('${c.id}')" title="Edit"><i class="bi bi-pencil-fill"></i></button>
            <button class="action-btn del"  onclick="deleteContact('${c.id}')" title="Delete"><i class="bi bi-trash-fill"></i></button>
          </div>
        </div>
      </div>
    </div>`;
}

function renderSidebar() {
  const favs = contacts.filter(c=>c.fav);
  const emers = contacts.filter(c=>c.emer);

  const sidebarItem = (c, redCall) => {
    const color = getColor(c.name);
    const initials = getInitials(c.name);
    const avatarHtml = c.photo ? `<img src="${c.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;"/>` : initials;
    return `
      <div class="sidebar-contact">
        <div class="sidebar-avatar" style="background:${color}">${avatarHtml}</div>
        <div>
          <div class="sidebar-name">${c.name}</div>
          <div class="sidebar-phone">${c.phone}</div>
        </div>
        <a href="tel:${c.phone}" class="sidebar-call ${redCall?'red-call':''}"><i class="bi bi-telephone-fill"></i></a>
      </div>`;
  };

  document.getElementById('sidebar-fav').innerHTML = favs.length
    ? favs.map(c=>sidebarItem(c,false)).join('')
    : '<div class="empty-msg">No favorites yet</div>';

  document.getElementById('sidebar-emer').innerHTML = emers.length
    ? emers.map(c=>sidebarItem(c,true)).join('')
    : '<div class="empty-msg">No emergency contacts</div>';
}

function toggleFav(id) {
  const c = contacts.find(c=>c.id===id);
  if (c) { c.fav = !c.fav; save(); }
}
function toggleEmer(id) {
  const c = contacts.find(c=>c.id===id);
  if (c) { c.emer = !c.emer; save(); }
}
function deleteContact(id) {
  if (!confirm('Delete this contact?')) return;
  contacts = contacts.filter(c=>c.id!==id);
  save();
}

function openAddModal() {
  editingId = null; photoDataUrl = null;
  document.getElementById('modal-title').textContent = 'Add New Contact';
  document.getElementById('f-name').value    = '';
  document.getElementById('f-phone').value   = '';
  document.getElementById('f-email').value   = '';
  document.getElementById('f-address').value = '';
  document.getElementById('f-group').value   = '';
  document.getElementById('f-notes').value   = '';
  document.getElementById('f-fav').checked   = false;
  document.getElementById('f-emer').checked  = false;
  document.getElementById('photoInput').value = '';
  document.getElementById('avatar-preview').style.display = 'none';
  document.getElementById('avatar-icon').style.display    = '';
  modal.show();
}

function openEditModal(id) {
  const c = contacts.find(c=>c.id===id);
  if (!c) return;
  editingId = id; photoDataUrl = c.photo || null;
  document.getElementById('modal-title').textContent = 'Edit Contact';
  document.getElementById('f-name').value    = c.name;
  document.getElementById('f-phone').value   = c.phone;
  document.getElementById('f-email').value   = c.email||'';
  document.getElementById('f-address').value = c.address||'';
  document.getElementById('f-group').value   = c.group||'';
  document.getElementById('f-notes').value   = c.notes||'';
  document.getElementById('f-fav').checked   = !!c.fav;
  document.getElementById('f-emer').checked  = !!c.emer;
  if (c.photo) {
    document.getElementById('avatar-preview').src = c.photo;
    document.getElementById('avatar-preview').style.display = 'block';
    document.getElementById('avatar-icon').style.display    = 'none';
  } else {
    document.getElementById('avatar-preview').style.display = 'none';
    document.getElementById('avatar-icon').style.display    = '';
  }
  modal.show();
}

function handlePhoto(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    photoDataUrl = e.target.result;
    document.getElementById('avatar-preview').src = photoDataUrl;
    document.getElementById('avatar-preview').style.display = 'block';
    document.getElementById('avatar-icon').style.display    = 'none';
  };
  reader.readAsDataURL(file);
}

function saveContact() {
  const name  = document.getElementById('f-name').value.trim();
  const phone = document.getElementById('f-phone').value.trim();
  if (!name)  { alert('Full Name is required.'); return; }
  if (!phone) { alert('Phone Number is required.'); return; }

  const data = {
    name,
    phone,
    email:   document.getElementById('f-email').value.trim(),
    address: document.getElementById('f-address').value.trim(),
    group:   document.getElementById('f-group').value,
    notes:   document.getElementById('f-notes').value.trim(),
    fav:     document.getElementById('f-fav').checked,
    emer:    document.getElementById('f-emer').checked,
    photo:   photoDataUrl || null,
  };

  if (editingId) {
    const idx = contacts.findIndex(c=>c.id===editingId);
    contacts[idx] = { ...contacts[idx], ...data };
  } else {
    data.id = Date.now().toString();
    contacts.push(data);
  }
  save();
  modal.hide();
}

renderAll();
