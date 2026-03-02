import { Elysia } from "elysia";
import { getAllRoomsAdmin, deleteRoomAdmin, getUsersFromRoom, STALE_ROOM_MS, getAllFeedbackAdmin, markFeedbackReadAdmin, deleteFeedbackAdmin, countUnreadFeedback } from "./domain/service";
import { NotFoundError } from "./server/errors.types";
import { register } from "./server/prometheus";

const WARNING_THRESHOLD_DAYS = 7;

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Day20 Admin</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #0f1117;
      color: #e2e8f0;
      min-height: 100vh;
      padding: 2rem;
    }
    h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 2rem; color: #f8fafc; }
    h1 span { color: #6366f1; }
    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .card {
      background: #1e2030;
      border: 1px solid #2d3148;
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
    }
    .card-label { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
    .card-value { font-size: 2rem; font-weight: 700; color: #f8fafc; }
    .card-value.warn { color: #f59e0b; }
    .card-value.danger { color: #ef4444; }
    .layout {
      display: grid;
      grid-template-columns: 260px 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
      align-items: start;
    }
    @media (max-width: 800px) { .layout { grid-template-columns: 1fr; } }
    .chart-box {
      background: #1e2030;
      border: 1px solid #2d3148;
      border-radius: 12px;
      padding: 1.25rem;
    }
    .chart-box h2 { font-size: 0.85rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1rem; }
    .table-box {
      background: #1e2030;
      border: 1px solid #2d3148;
      border-radius: 12px;
      overflow: hidden;
    }
    .table-box h2 {
      font-size: 0.85rem;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 1.25rem 1.5rem 0.75rem;
      border-bottom: 1px solid #2d3148;
    }
    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    th {
      text-align: left;
      padding: 0.75rem 1rem;
      color: #64748b;
      font-weight: 500;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #2d3148;
    }
    td { padding: 0.75rem 1rem; border-bottom: 1px solid #1a1d2e; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #252840; }
    .badge {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      font-size: 0.7rem;
      font-weight: 600;
    }
    .badge-green { background: #14532d; color: #4ade80; }
    .badge-yellow { background: #451a03; color: #fbbf24; }
    .badge-red { background: #450a0a; color: #f87171; }
    .btn-delete {
      background: transparent;
      border: 1px solid #3f1515;
      color: #f87171;
      padding: 0.3rem 0.75rem;
      border-radius: 6px;
      font-size: 0.75rem;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-delete:hover { background: #3f1515; }
    .muted { color: #64748b; font-size: 0.8rem; }
    .refresh-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }
    .refresh-bar button {
      background: #2d3148;
      border: none;
      color: #94a3b8;
      padding: 0.4rem 1rem;
      border-radius: 6px;
      font-size: 0.8rem;
      cursor: pointer;
    }
    .refresh-bar button:hover { background: #374060; }
    #last-updated { font-size: 0.75rem; color: #4a5568; }
    #error-msg { color: #f87171; font-size: 0.85rem; margin-bottom: 1rem; display: none; }
    .room-id-btn {
      background: none; border: none; cursor: pointer;
      font-size: 0.8rem; color: #818cf8; font-family: monospace;
      padding: 0; text-decoration: underline dotted;
    }
    .room-id-btn:hover { color: #a5b4fc; }
    .modal-backdrop {
      display: none; position: fixed; inset: 0;
      background: rgba(0,0,0,0.6); z-index: 100;
      align-items: center; justify-content: center;
    }
    .modal-backdrop.open { display: flex; }
    .modal {
      background: #1e2030; border: 1px solid #2d3148; border-radius: 14px;
      width: 100%; max-width: 560px; max-height: 80vh;
      display: flex; flex-direction: column; overflow: hidden;
    }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem 1.25rem; border-bottom: 1px solid #2d3148;
    }
    .modal-header h3 { font-size: 0.95rem; color: #f8fafc; }
    .modal-header span { font-size: 0.8rem; color: #64748b; margin-left: 0.5rem; font-family: monospace; }
    .modal-close {
      background: none; border: none; color: #64748b;
      font-size: 1.25rem; cursor: pointer; line-height: 1;
    }
    .modal-close:hover { color: #e2e8f0; }
    .modal-body { overflow-y: auto; }
    .badge-role-admin { background: #312e81; color: #a5b4fc; }
    .badge-role-subAdmin { background: #1e3a5f; color: #7dd3fc; }
    .badge-role-user { background: #1e293b; color: #94a3b8; }
  </style>
</head>
<body>
  <h1>Day20 <span>Admin</span></h1>

  <div class="refresh-bar">
    <span id="last-updated">Loading...</span>
    <button onclick="loadAll()">Refresh</button>
  </div>

  <div id="error-msg"></div>

  <div class="cards" id="cards">
    <div class="card"><div class="card-label">Total Rooms</div><div class="card-value" id="stat-rooms">—</div></div>
    <div class="card"><div class="card-label">Total Users</div><div class="card-value" id="stat-users">—</div></div>
    <div class="card"><div class="card-label">Expiring Soon</div><div class="card-value warn" id="stat-expiring">—</div></div>
    <div class="card"><div class="card-label">Expired / Stale</div><div class="card-value danger" id="stat-stale">—</div></div>
    <div class="card"><div class="card-label">Unread Feedback</div><div class="card-value" id="stat-feedback">—</div></div>
  </div>

  <div class="layout">
    <div class="chart-box">
      <h2>Room Health</h2>
      <canvas id="health-chart"></canvas>
    </div>
    <div class="table-box">
      <h2>Rooms</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Users</th>
            <th>Last Active</th>
            <th>Expires</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="rooms-tbody">
          <tr><td colspan="6" class="muted" style="padding:1.5rem">Loading...</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="table-box" style="margin-bottom:2rem">
    <h2>Feedback</h2>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Name</th>
          <th>Message</th>
          <th>Email</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody id="feedback-tbody">
        <tr><td colspan="6" class="muted" style="padding:1.5rem">Loading...</td></tr>
      </tbody>
    </table>
  </div>

  <div class="modal-backdrop" id="users-modal" onclick="closeModal(event)">
    <div class="modal">
      <div class="modal-header">
        <div><h3>Users <span id="modal-room-id"></span></h3></div>
        <button class="modal-close" onclick="closeUsersModal()">✕</button>
      </div>
      <div class="modal-body">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Timezone</th>
              <th>PIN</th>
            </tr>
          </thead>
          <tbody id="users-tbody"></tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    const STALE_DAYS = ${Math.floor(STALE_ROOM_MS / (1000 * 60 * 60 * 24))};
    const WARNING_DAYS = ${WARNING_THRESHOLD_DAYS};
    let chart = null;

    function formatDate(iso) {
      if (!iso) return '—';
      const d = new Date(iso);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function expiryBadge(days) {
      if (days <= 0) return '<span class="badge badge-red">Stale</span>';
      if (days <= WARNING_DAYS) return \`<span class="badge badge-yellow">\${days}d</span>\`;
      return \`<span class="badge badge-green">\${days}d</span>\`;
    }

    async function deleteRoom(id) {
      if (!confirm(\`Delete room "\${id}"? This cannot be undone.\`)) return;
      const res = await fetch(\`/api/rooms/\${encodeURIComponent(id)}\`, { method: 'DELETE' });
      if (res.ok) loadAll();
      else {
        const body = await res.json().catch(() => ({}));
        showError(body.message || 'Delete failed');
      }
    }

    function showError(msg) {
      const el = document.getElementById('error-msg');
      el.textContent = msg;
      el.style.display = 'block';
      setTimeout(() => { el.style.display = 'none'; }, 4000);
    }

    async function loadAll() {
      document.getElementById('last-updated').textContent = 'Refreshing...';
      const [statsRes, roomsRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/rooms'),
      ]);
      if (!statsRes.ok || !roomsRes.ok) {
        showError('Failed to load data');
        return;
      }
      const stats = await statsRes.json();
      const rooms = await roomsRes.json();

      document.getElementById('stat-rooms').textContent = stats.totalRooms;
      document.getElementById('stat-users').textContent = stats.totalUsers;
      document.getElementById('stat-expiring').textContent = stats.expiringCount;
      document.getElementById('stat-stale').textContent = stats.staleCount;
      const feedbackEl = document.getElementById('stat-feedback');
      feedbackEl.textContent = stats.unreadFeedback;
      feedbackEl.className = 'card-value' + (stats.unreadFeedback > 0 ? ' warn' : '');
      document.getElementById('last-updated').textContent = 'Updated ' + new Date().toLocaleTimeString();

      renderChart(stats.freshCount, stats.expiringCount, stats.staleCount);
      renderTable(rooms);
      loadFeedback();
    }

    function renderChart(fresh, expiring, stale) {
      const ctx = document.getElementById('health-chart').getContext('2d');
      const data = {
        labels: ['Fresh', 'Expiring Soon', 'Stale'],
        datasets: [{
          data: [fresh, expiring, stale],
          backgroundColor: ['#166534', '#92400e', '#7f1d1d'],
          borderColor: ['#4ade80', '#fbbf24', '#f87171'],
          borderWidth: 2,
        }]
      };
      if (chart) { chart.data = data; chart.update(); return; }
      chart = new Chart(ctx, {
        type: 'doughnut',
        data,
        options: {
          cutout: '68%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#94a3b8', padding: 16, font: { size: 12 } }
            }
          }
        }
      });
    }

    function renderTable(rooms) {
      const tbody = document.getElementById('rooms-tbody');
      if (!rooms.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="muted" style="padding:1.5rem">No rooms found.</td></tr>';
        return;
      }
      tbody.innerHTML = rooms.map(r => \`
        <tr>
          <td><button class="room-id-btn" onclick="showUsers('\${r.id.replace(/'/g, "\\\\'")}')">\${r.id}</button></td>
          <td>\${r.name}</td>
          <td>\${r.userCount}</td>
          <td class="muted">\${formatDate(r.updatedAt)}</td>
          <td>\${expiryBadge(r.daysUntilExpiry)}</td>
          <td><button class="btn-delete" onclick="deleteRoom('\${r.id.replace(/'/g, "\\\\'")}')">Delete</button></td>
        </tr>
      \`).join('');
    }

    async function showUsers(roomId) {
      document.getElementById('modal-room-id').textContent = roomId;
      document.getElementById('users-tbody').innerHTML = '<tr><td colspan="4" class="muted" style="padding:1rem">Loading...</td></tr>';
      document.getElementById('users-modal').classList.add('open');

      const res = await fetch(\`/api/rooms/\${encodeURIComponent(roomId)}/users\`);
      if (!res.ok) {
        document.getElementById('users-tbody').innerHTML = '<tr><td colspan="4" class="muted" style="padding:1rem">Failed to load users.</td></tr>';
        return;
      }
      const users = await res.json();
      if (!users.length) {
        document.getElementById('users-tbody').innerHTML = '<tr><td colspan="4" class="muted" style="padding:1rem">No users.</td></tr>';
        return;
      }
      document.getElementById('users-tbody').innerHTML = users.map(u => \`
        <tr>
          <td>\${u.name}</td>
          <td><span class="badge badge-role-\${u.role}">\${u.role}</span></td>
          <td class="muted">\${u.timezone ?? '—'}</td>
          <td class="muted">\${u.hasPin ? '✓' : '—'}</td>
        </tr>
      \`).join('');
    }

    function closeUsersModal() {
      document.getElementById('users-modal').classList.remove('open');
    }

    function closeModal(e) {
      if (e.target === document.getElementById('users-modal')) closeUsersModal();
    }

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeUsersModal(); });

    async function loadFeedback() {
      const res = await fetch('/api/feedback');
      if (!res.ok) return;
      const items = await res.json();
      const tbody = document.getElementById('feedback-tbody');
      if (!items.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="muted" style="padding:1.5rem">No feedback yet.</td></tr>';
        return;
      }
      tbody.innerHTML = items.map(f => \`
        <tr style="\${f.read ? 'opacity:0.5' : 'background:rgba(245,158,11,0.05)'}">
          <td class="muted">\${formatDate(f.createdAt)}</td>
          <td>\${f.name || '<span class="muted">Anonymous</span>'}</td>
          <td style="max-width:320px;word-break:break-word">\${f.message}</td>
          <td class="muted">\${f.email || '—'}</td>
          <td>\${f.read ? '<span class="badge badge-green">Read</span>' : '<span class="badge badge-yellow">Unread</span>'}</td>
          <td style="display:flex;gap:0.5rem">
            \${f.read ? '' : \`<button class="btn-delete" style="border-color:#1e3a5f;color:#7dd3fc" onclick="markFeedbackRead('\${f.id}')">Mark Read</button>\`}
            <button class="btn-delete" onclick="deleteFeedback('\${f.id}')">Delete</button>
          </td>
        </tr>
      \`).join('');
    }

    async function markFeedbackRead(id) {
      const res = await fetch(\`/api/feedback/\${encodeURIComponent(id)}/read\`, { method: 'PATCH' });
      if (res.ok) loadAll();
      else showError('Failed to mark as read');
    }

    async function deleteFeedback(id) {
      if (!confirm('Delete this feedback? This cannot be undone.')) return;
      const res = await fetch(\`/api/feedback/\${encodeURIComponent(id)}\`, { method: 'DELETE' });
      if (res.ok) loadAll();
      else showError('Failed to delete feedback');
    }

    loadAll();
  </script>
</body>
</html>`;

export const adminServer = new Elysia()
  .get("/", () => new Response(HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } }))
  .get("/api/stats", async () => {
    const [rooms, unreadFeedback] = await Promise.all([getAllRoomsAdmin(), countUnreadFeedback()]);
    const freshCount = rooms.filter((r) => r.daysUntilExpiry > WARNING_THRESHOLD_DAYS).length;
    const expiringCount = rooms.filter(
      (r) => r.daysUntilExpiry > 0 && r.daysUntilExpiry <= WARNING_THRESHOLD_DAYS,
    ).length;
    const staleCount = rooms.filter((r) => r.daysUntilExpiry <= 0).length;
    const totalUsers = rooms.reduce((sum, r) => sum + r.userCount, 0);
    return {
      totalRooms: rooms.length,
      totalUsers,
      freshCount,
      expiringCount,
      staleCount,
      unreadFeedback,
    };
  })
  .get("/api/rooms", async () => {
    return getAllRoomsAdmin();
  })
  .get("/api/rooms/:id/users", async ({ params, status }) => {
    try {
      return getUsersFromRoom(params.id);
    } catch (e) {
      if (e instanceof NotFoundError) return status(404, { message: e.message });
      throw e;
    }
  })
  .get("/metrics", async () =>
    new Response(await register.metrics(), {
      headers: { "Content-Type": register.contentType },
    }),
  )
  .delete("/api/rooms/:id", async ({ params, status }) => {
    try {
      await deleteRoomAdmin(params.id);
      return { success: true };
    } catch (e) {
      if (e instanceof NotFoundError) return status(404, { message: e.message });
      throw e;
    }
  })
  .get("/api/feedback", async () => {
    return getAllFeedbackAdmin();
  })
  .patch("/api/feedback/:id/read", async ({ params }) => {
    await markFeedbackReadAdmin(params.id);
    return { ok: true };
  })
  .delete("/api/feedback/:id", async ({ params }) => {
    await deleteFeedbackAdmin(params.id);
    return { ok: true };
  });

export function startAdminServer() {
  adminServer.listen(3250);
  console.log("Admin server started port 3250");
}
