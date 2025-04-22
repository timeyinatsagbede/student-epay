const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Add new student
app.post('/admin/add-student', async (req, res) => {
  const { first_name, last_name, student_id, initial_transaction } = req.body;

  if (!first_name || !last_name || !student_id || !initial_transaction?.type || !initial_transaction?.amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    await conn.execute(
      'INSERT INTO students (first_name, last_name, student_id) VALUES (?, ?, ?)',
      [first_name, last_name, student_id]
    );

    await conn.execute(
      'INSERT INTO transactions (student_id, type, amount) VALUES (?, ?, ?)',
      [student_id, initial_transaction.type, initial_transaction.amount]
    );

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();

    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'Student ID already exists' });
    } else {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  } finally {
    conn.release();
  }
});

// Catch-all for unknown routes
app.use((req, res) => {
  res.status(404).send('Not found');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
