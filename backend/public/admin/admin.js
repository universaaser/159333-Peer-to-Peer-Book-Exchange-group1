const storageKey = 'p2p_admin_token';

const qs = (id) => document.getElementById(id);
const apiBaseInput = qs('api-base');
const tokenInput = qs('token');
const healthButton = qs('health-check');
const healthResult = qs('health-result');
const saveTokenButton = qs('save-token');
const loginEmail = qs('login-email');
const loginPassword = qs('login-password');
const loginSubmit = qs('login-submit');
const logoutSubmit = qs('logout-submit');
const loginStatus = qs('login-status');

const pendingList = qs('pending-list');
const flaggedList = qs('flagged-list');
const allListingsList = qs('all-listings-list');
const usersList = qs('users-list');
const reportList = qs('report-list');
const reportStatus = qs('report-status');

const banUserId = qs('ban-user-id');
const banAction = qs('ban-action');
const banSubmit = qs('ban-submit');
const banResult = qs('ban-result');

/* ── Token helpers ── */
const loadToken = () => {
  const token = localStorage.getItem(storageKey);
  if (token) {
    tokenInput.value = token;
    loginStatus.textContent = 'Token loaded';
  }
};

const saveToken = () => {
  localStorage.setItem(storageKey, tokenInput.value.trim());
  loginStatus.textContent = tokenInput.value.trim() ? 'Token saved' : 'Token cleared';
};

const getHeaders = () => {
  const token = tokenInput.value.trim();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const fetchJson = async (url, options = {}) => {
  const res = await fetch(url, {
    ...options,
    headers: { ...getHeaders(), ...(options.headers || {}) }
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed (${res.status})`);
  }
  return res.json();
};

/* ── Auth ── */
const login = async () => {
  const email = loginEmail.value.trim();
  const password = loginPassword.value.trim();
  if (!email || !password) { loginStatus.textContent = 'Email and password are required'; return; }
  loginStatus.textContent = 'Logging in...';
  try {
    const data = await fetchJson(`${apiBaseInput.value}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data?.user?.role !== 'admin') {
      loginStatus.textContent = 'Login ok, but user is not admin';
      return;
    }
    tokenInput.value = data.token;
    saveToken();
    loginStatus.textContent = `Logged in as ${data.user.username || data.user.email}`;
    await Promise.all([loadPending(), loadFlagged(), loadReports(), loadUsers(), loadAllListings()]);
  } catch (err) {
    loginStatus.textContent = err.message;
  }
};

const logout = () => {
  tokenInput.value = '';
  localStorage.removeItem(storageKey);
  loginStatus.textContent = 'Logged out';
};

/* ── Listings helpers ── */
const LISTING_STATUSES = ['pending', 'available', 'reserved', 'sold', 'removed'];

const renderListings = (container, listings, refreshFn) => {
  container.innerHTML = '';
  if (!listings.length) { container.innerHTML = '<p class="muted">No items.</p>'; return; }
  const list = document.createElement('div');
  list.className = 'list';
  list.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';

  listings.forEach((listing) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${listing.title || 'Untitled'}</h3>
      <div class="meta">ID: ${listing._id}</div>
      <div class="meta">Status: <strong>${listing.status}</strong> | Flagged: ${listing.flagged ? '⚠️ yes' : 'no'}</div>
      <div class="meta">Seller: ${listing.seller?.username || 'unknown'} | Price: $${listing.price ?? '-'}</div>
      ${listing.course ? `<div class="meta">Course: ${listing.course}</div>` : ''}
    `;

    const actions = document.createElement('div');
    actions.className = 'actions';
    LISTING_STATUSES.forEach((status) => {
      if (status === listing.status) return;
      const btn = document.createElement('button');
      btn.textContent = `→ ${status}`;
      btn.className = 'secondary';
      btn.addEventListener('click', async () => {
        try {
          await fetchJson(`${apiBaseInput.value}/listings/${listing._id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
          });
          refreshFn();
        } catch (err) {
          alert(err.message);
        }
      });
      actions.appendChild(btn);
    });

    card.appendChild(actions);
    list.appendChild(card);
  });
  container.appendChild(list);
};

const loadPending = async () => {
  try {
    const response = await fetchJson(`${apiBaseInput.value}/listings?status=pending&includeFlagged=true`);
    renderListings(pendingList, response.data || [], loadPending);
  } catch (err) {
    pendingList.innerHTML = `<p class="muted">${err.message}</p>`;
  }
};

const loadFlagged = async () => {
  try {
    const response = await fetchJson(`${apiBaseInput.value}/listings?includeFlagged=true`);
    const flagged = (response.data || []).filter((item) => item.flagged);
    renderListings(flaggedList, flagged, loadFlagged);
  } catch (err) {
    flaggedList.innerHTML = `<p class="muted">${err.message}</p>`;
  }
};

const loadAllListings = async () => {
  const statusVal = qs('all-listings-status').value;
  const keyword = qs('all-listings-keyword').value.trim();
  try {
    let url = `${apiBaseInput.value}/listings?includeFlagged=true`;
    if (statusVal) url += `&status=${statusVal}`;
    if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
    const response = await fetchJson(url);
    const items = Array.isArray(response) ? response : (response.data || []);
    renderListings(allListingsList, items, loadAllListings);
  } catch (err) {
    allListingsList.innerHTML = `<p class="muted">${err.message}</p>`;
  }
};

/* ── Users ── */
const loadUsers = async () => {
  usersList.innerHTML = '<p class="muted">Loading...</p>';
  try {
    const users = await fetchJson(`${apiBaseInput.value}/users`);
    usersList.innerHTML = '';
    if (!users.length) { usersList.innerHTML = '<p class="muted">No users found.</p>'; return; }

    const list = document.createElement('div');
    list.className = 'list';
    list.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';

    users.forEach((u) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <h3>${u.username} ${u.isBanned ? '<span style="color:#f87171;font-size:11px;">[BANNED]</span>' : ''}</h3>
        <div class="meta">ID: ${u._id}</div>
        <div class="meta">Email: ${u.email}</div>
        <div class="meta">Role: <strong style="color:${u.role === 'admin' ? '#34d399' : '#94a3b8'}">${u.role}</strong></div>
        <div class="meta">Rating: ${u.rating ?? 0} ⭐ (${u.reviewCount ?? 0} reviews)</div>
        <div class="meta">Joined: ${new Date(u.createdAt).toLocaleDateString()}</div>
      `;

      if (u.role !== 'admin') {
        const actions = document.createElement('div');
        actions.className = 'actions';

        const banBtn = document.createElement('button');
        banBtn.textContent = u.isBanned ? 'Unban' : 'Ban';
        banBtn.className = u.isBanned ? 'secondary' : '';
        banBtn.style.borderColor = u.isBanned ? '#334155' : '#ef4444';
        banBtn.style.color = u.isBanned ? '#e2e8f0' : '#ef4444';
        banBtn.addEventListener('click', async () => {
          try {
            const result = await fetchJson(`${apiBaseInput.value}/users/${u._id}/ban`, {
              method: 'PATCH',
              body: JSON.stringify({ isBanned: !u.isBanned })
            });
            u.isBanned = result.isBanned;
            banBtn.textContent = result.isBanned ? 'Unban' : 'Ban';
            banBtn.style.color = result.isBanned ? '#e2e8f0' : '#ef4444';
            card.querySelector('h3').innerHTML = `${u.username} ${result.isBanned ? '<span style="color:#f87171;font-size:11px;">[BANNED]</span>' : ''}`;
          } catch (err) {
            alert(err.message);
          }
        });

        actions.appendChild(banBtn);
        card.appendChild(actions);
      }

      list.appendChild(card);
    });
    usersList.appendChild(list);
  } catch (err) {
    usersList.innerHTML = `<p class="muted">${err.message}</p>`;
  }
};

/* ── Reports ── */
const renderReports = (reports) => {
  reportList.innerHTML = '';
  if (!reports.length) { reportList.innerHTML = '<p class="muted">No reports.</p>'; return; }
  const list = document.createElement('div');
  list.className = 'list';

  reports.forEach((report) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${report.reason}</h3>
      <div class="meta">ID: ${report._id}</div>
      <div class="meta">Status: <strong>${report.status}</strong></div>
      <div class="meta">Reporter: ${report.reporter?.username || 'unknown'}</div>
      <div class="meta">Reported User: ${report.reportedUser?.username || '-'}</div>
      <div class="meta">Listing: ${report.listing?.title || '-'}</div>
    `;

    const actions = document.createElement('div');
    actions.className = 'actions';
    ['reviewing', 'closed'].forEach((status) => {
      const btn = document.createElement('button');
      btn.textContent = `Mark ${status}`;
      btn.className = 'secondary';
      btn.addEventListener('click', async () => {
        const note = prompt('Admin note (optional):', '');
        try {
          await fetchJson(`${apiBaseInput.value}/reports/${report._id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status, adminNote: note || '' })
          });
          await loadReports();
        } catch (err) {
          alert(err.message);
        }
      });
      actions.appendChild(btn);
    });

    card.appendChild(actions);
    list.appendChild(card);
  });
  reportList.appendChild(list);
};

const loadReports = async () => {
  try {
    const statusFilter = reportStatus.value;
    const query = statusFilter ? `?status=${statusFilter}` : '';
    const reports = await fetchJson(`${apiBaseInput.value}/reports${query}`);
    renderReports(reports || []);
  } catch (err) {
    reportList.innerHTML = `<p class="muted">${err.message}</p>`;
  }
};

/* ── Ban by ID ── */
const handleBan = async () => {
  const userId = banUserId.value.trim();
  if (!userId) { banResult.textContent = 'User ID is required'; return; }
  try {
    const result = await fetchJson(`${apiBaseInput.value}/users/${userId}/ban`, {
      method: 'PATCH',
      body: JSON.stringify({ isBanned: banAction.value === 'true' })
    });
    banResult.textContent = `Updated: banned=${result.isBanned}`;
    loadUsers();
  } catch (err) {
    banResult.textContent = err.message;
  }
};

/* ── Event listeners ── */
healthButton.addEventListener('click', async () => {
  try {
    const res = await fetch('/');
    const data = await res.json();
    healthResult.textContent = data.message || 'OK';
  } catch (err) {
    healthResult.textContent = 'Unavailable';
  }
});

saveTokenButton.addEventListener('click', saveToken);
qs('load-pending').addEventListener('click', loadPending);
qs('load-flagged').addEventListener('click', loadFlagged);
qs('load-all-listings').addEventListener('click', loadAllListings);
qs('load-users').addEventListener('click', loadUsers);
qs('load-reports').addEventListener('click', loadReports);
banSubmit.addEventListener('click', handleBan);

loadToken();
loginSubmit.addEventListener('click', login);
logoutSubmit.addEventListener('click', logout);
