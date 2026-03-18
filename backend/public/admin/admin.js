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
const reportList = qs('report-list');
const reportStatus = qs('report-status');

const banUserId = qs('ban-user-id');
const banAction = qs('ban-action');
const banSubmit = qs('ban-submit');
const banResult = qs('ban-result');

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
    headers: {
      ...getHeaders(),
      ...(options.headers || {})
    }
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed (${res.status})`);
  }
  return res.json();
};

const login = async () => {
  const email = loginEmail.value.trim();
  const password = loginPassword.value.trim();
  if (!email || !password) {
    loginStatus.textContent = 'Email and password are required';
    return;
  }
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
    await loadPending();
    await loadFlagged();
    await loadReports();
  } catch (err) {
    loginStatus.textContent = err.message;
  }
};

const logout = () => {
  tokenInput.value = '';
  localStorage.removeItem(storageKey);
  loginStatus.textContent = 'Logged out';
};

const renderListings = (container, listings, type) => {
  container.innerHTML = '';
  const list = document.createElement('div');
  list.className = 'list';

  if (!listings.length) {
    container.innerHTML = '<p class="muted">No items.</p>';
    return;
  }

  listings.forEach((listing) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${listing.title || 'Untitled'}</h3>
      <div class="meta">ID: ${listing._id}</div>
      <div class="meta">Status: ${listing.status} | Flagged: ${listing.flagged ? 'yes' : 'no'}</div>
      <div class="meta">Seller: ${listing.seller?.username || 'unknown'}</div>
    `;

    const actions = document.createElement('div');
    actions.className = 'actions';

    const statuses = type === 'pending'
      ? [{ label: '✓ Approve', value: 'available' }, { label: '✕ Reject', value: 'removed' }]
      : [
          { label: 'Set available', value: 'available' },
          { label: 'Set reserved', value: 'reserved' },
          { label: 'Set sold', value: 'sold' },
          { label: 'Set removed', value: 'removed' }
        ];

    statuses.forEach(({ label, value }) => {
      const button = document.createElement('button');
      button.textContent = label;
      button.className = 'secondary';
      button.addEventListener('click', async () => {
        try {
          await fetchJson(`${apiBaseInput.value}/listings/${listing._id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: value })
          });
          if (type === 'pending') await loadPending();
          if (type === 'flagged') await loadFlagged();
        } catch (err) {
          alert(err.message);
        }
      });
      actions.appendChild(button);
    });

    card.appendChild(actions);
    list.appendChild(card);
  });

  container.appendChild(list);
};

const loadPending = async () => {
  try {
    const response = await fetchJson(`${apiBaseInput.value}/listings?status=pending`);
    renderListings(pendingList, response.data || [], 'pending');
  } catch (err) {
    pendingList.innerHTML = `<p class="muted">${err.message}</p>`;
  }
};

const loadFlagged = async () => {
  try {
    const response = await fetchJson(`${apiBaseInput.value}/listings?includeFlagged=true&status=available`);
    const flagged = (response.data || []).filter((item) => item.flagged);
    renderListings(flaggedList, flagged, 'flagged');
  } catch (err) {
    flaggedList.innerHTML = `<p class="muted">${err.message}</p>`;
  }
};

const renderReports = (reports) => {
  reportList.innerHTML = '';
  if (!reports.length) {
    reportList.innerHTML = '<p class="muted">No reports.</p>';
    return;
  }
  const list = document.createElement('div');
  list.className = 'list';

  reports.forEach((report) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${report.reason}</h3>
      <div class="meta">ID: ${report._id}</div>
      <div class="meta">Status: ${report.status}</div>
      <div class="meta">Reporter: ${report.reporter?.username || 'unknown'}</div>
      <div class="meta">Reported User: ${report.reportedUser?.username || '-'}</div>
      <div class="meta">Listing: ${report.listing?.title || '-'}</div>
    `;

    const actions = document.createElement('div');
    actions.className = 'actions';

    ['reviewing', 'closed'].forEach((status) => {
      const button = document.createElement('button');
      button.textContent = `Mark ${status}`;
      button.className = 'secondary';
      button.addEventListener('click', async () => {
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
      actions.appendChild(button);
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

const handleBan = async () => {
  const userId = banUserId.value.trim();
  if (!userId) {
    banResult.textContent = 'User ID is required';
    return;
  }
  try {
    const result = await fetchJson(`${apiBaseInput.value}/reports/user/${userId}/ban`, {
      method: 'PATCH',
      body: JSON.stringify({ isBanned: banAction.value === 'true' })
    });
    banResult.textContent = `Updated user ${result.id}: banned=${result.isBanned}`;
  } catch (err) {
    banResult.textContent = err.message;
  }
};

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
qs('load-reports').addEventListener('click', loadReports);
banSubmit.addEventListener('click', handleBan);

loadToken();
loginSubmit.addEventListener('click', login);
logoutSubmit.addEventListener('click', logout);
