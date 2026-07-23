const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'database.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper: Safely Read JSON Data
const readDB = () => {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const initialData = { items: [{ id: 1, title: "Welcome!", description: "Ei app-ti Express + JSON DB diye cholche." }] };
      fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    const rawData = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(rawData || '{"items":[]}');
  } catch (error) {
    console.error("Error reading database:", error);
    return { items: [] };
  }
};

// Helper: Safely Write JSON Data
const writeDB = (data) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error("Error writing database:", error);
    return false;
  }
};

// --- API ROUTES ---
app.get('/api/items', (req, res) => {
  const db = readDB();
  res.json({ success: true, data: db.items });
});

app.post('/api/items', (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) {
    return res.status(400).json({ success: false, message: 'Title & Description required.' });
  }

  const db = readDB();
  const newItem = { id: Date.now(), title, description };
  db.items.push(newItem);

  if (writeDB(db)) {
    return res.status(201).json({ success: true, data: newItem });
  } else {
    return res.status(500).json({ success: false, message: 'Failed to save data.' });
  }
});

app.delete('/api/items/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const db = readDB();
  const initialLength = db.items.length;
  db.items = db.items.filter(item => item.id !== id);

  if (db.items.length === initialLength) {
    return res.status(404).json({ success: false, message: 'Item not found.' });
  }

  if (writeDB(db)) {
    return res.json({ success: true, message: 'Deleted successfully.' });
  } else {
    return res.status(500).json({ success: false, message: 'Failed to delete.' });
  }
});

// Shared CSS Style
const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  :root {
    --bg-color: #0f172a;
    --card-bg: #1e293b;
    --text-main: #f8fafc;
    --text-muted: #94a3b8;
    --accent-primary: #6366f1;
    --accent-hover: #4f46e5;
    --accent-danger: #ef4444;
    --border-color: #334155;
    --radius: 12px;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
  body { background-color: var(--bg-color); color: var(--text-main); min-height: 100vh; display: flex; justify-content: center; align-items: center; padding: 20px; }
  .container { width: 100%; max-width: 650px; background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(16px); border: 1px solid var(--border-color); border-radius: 16px; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  h1 { font-size: 1.75rem; font-weight: 700; }
  h2 { font-size: 1.25rem; margin-bottom: 16px; }
  hr { border: none; height: 1px; background: var(--border-color); margin: 20px 0; }
  .btn { display: inline-block; background: var(--accent-primary); color: #fff; padding: 10px 18px; border-radius: var(--radius); text-decoration: none; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s; }
  .btn:hover { background: var(--accent-hover); transform: translateY(-2px); }
  .btn.secondary { background: transparent; border: 1px solid var(--border-color); color: var(--text-muted); }
  .btn.danger { background: var(--accent-danger); }
  .form-group { margin-bottom: 16px; }
  input, textarea { width: 100%; background: #0f172a; border: 1px solid var(--border-color); color: var(--text-main); padding: 12px 16px; border-radius: var(--radius); outline: none; }
  textarea { resize: vertical; min-height: 90px; }
  .item-list { display: flex; flex-direction: column; gap: 16px; margin-top: 20px; }
  .card { background: var(--card-bg); border: 1px solid var(--border-color); padding: 20px; border-radius: var(--radius); }
  .space-between { display: flex; justify-content: space-between; align-items: center; }
  .empty-state { text-align: center; color: var(--text-muted); padding: 20px 0; font-style: italic; }
`;

// FRONTEND USER PAGE
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>User View - Testing App</title>
      <style>${globalCSS}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚀 All Items</h1>
          <a href="/admin" class="btn">Admin Panel →</a>
        </div>
        <hr>
        <div id="itemList" class="item-list"><div class="empty-state">Loading items...</div></div>
      </div>
      <script>
        async function loadItems() {
          try {
            const res = await fetch('/api/items');
            const result = await res.json();
            const container = document.getElementById('itemList');
            if (result.success && result.data.length > 0) {
              container.innerHTML = result.data.map(item => \`
                <div class="card">
                  <h3>\${item.title}</h3>
                  <p>\${item.description}</p>
                </div>
              \`).join('');
            } else {
              container.innerHTML = '<div class="empty-state">No items found! Add something from Admin.</div>';
            }
          } catch (err) {
            document.getElementById('itemList').innerHTML = '<div class="empty-state">Failed to load data.</div>';
          }
        }
        loadItems();
      </script>
    </body>
    </html>
  `);
});

// FRONTEND ADMIN PAGE
app.get('/admin', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Admin Dashboard</title>
      <style>${globalCSS}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚡ Admin Panel</h1>
          <a href="/" class="btn secondary">← Back to Home</a>
        </div>
        <form id="addForm" style="margin-bottom: 24px;">
          <h2>Add New Item</h2>
          <div class="form-group">
            <input type="text" id="title" placeholder="Item Title..." required>
          </div>
          <div class="form-group">
            <textarea id="description" placeholder="Item Description..." required></textarea>
          </div>
          <button type="submit" class="btn" style="width: 100%;">+ Save Item</button>
        </form>
        <hr>
        <h2>Manage Items</h2>
        <div id="adminItemList" class="item-list"><div class="empty-state">Loading management list...</div></div>
      </div>
      <script>
        async function loadAdminItems() {
          try {
            const res = await fetch('/api/items');
            const result = await res.json();
            const container = document.getElementById('adminItemList');
            if (result.success && result.data.length > 0) {
              container.innerHTML = result.data.map(item => \`
                <div class="card space-between">
                  <div>
                    <h3>\${item.title}</h3>
                    <p>\${item.description}</p>
                  </div>
                  <button onclick="deleteItem(\${item.id})" class="btn danger">Delete</button>
                </div>
              \`).join('');
            } else {
              container.innerHTML = '<div class="empty-state">No items available.</div>';
            }
          } catch (err) {
            document.getElementById('adminItemList').innerHTML = '<div class="empty-state">Failed to load data.</div>';
          }
        }

        document.getElementById('addForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const title = document.getElementById('title').value;
          const description = document.getElementById('description').value;

          const res = await fetch('/api/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description })
          });

          if (res.ok) {
            document.getElementById('title').value = '';
            document.getElementById('description').value = '';
            loadAdminItems();
          } else {
            alert('Failed to add item!');
          }
        });

        async function deleteItem(id) {
          if (!confirm('Are you sure?')) return;
          const res = await fetch('/api/items/' + id, { method: 'DELETE' });
          if (res.ok) loadAdminItems();
          else alert('Failed to delete item!');
        }

        loadAdminItems();
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
