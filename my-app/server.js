const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'database.json');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Helper: Safely Read JSON Data
const readDB = () => {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const initialData = { items: [] };
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

// 1. Get all items
app.get('/api/items', (req, res) => {
  const db = readDB();
  res.json({ success: true, data: db.items });
});

// 2. Add new item (Admin)
app.post('/api/items', (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ success: false, message: 'Title & Description are required.' });
  }

  const db = readDB();
  const newItem = {
    id: Date.now(), // Unique ID based on timestamp
    title,
    description
  };

  db.items.push(newItem);

  if (writeDB(db)) {
    return res.status(201).json({ success: true, data: newItem });
  } else {
    return res.status(500).json({ success: false, message: 'Failed to save data.' });
  }
});

// 3. Delete item (Admin)
app.delete('/api/items/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const db = readDB();

  const initialLength = db.items.length;
  db.items = db.items.filter(item => item.id !== id);

  if (db.items.length === initialLength) {
    return res.status(404).json({ success: false, message: 'Item not found.' });
  }

  if (writeDB(db)) {
    return res.json({ success: true, message: 'Item deleted successfully.' });
  } else {
    return res.status(500).json({ success: false, message: 'Failed to delete item.' });
  }
});

// Server Start
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
