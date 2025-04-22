const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// MySQL connection pool
const pool = require('./db/mysql-connection');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Check student balance
app.post("/student/:id", async (req, res) => {
    const studentId = req.params.id;
    const { first_name, last_name } = req.body;
  
    const conn = await pool.getConnection();
  
    try {
      const [[student]] = await conn.execute(
        "SELECT first_name, last_name FROM students WHERE student_id = ? AND first_name = ? AND last_name = ?",
        [studentId, first_name, last_name]
      );
  
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
  
      const [transactions] = await conn.execute(
        "SELECT type, amount FROM transactions WHERE student_id = ?",
        [studentId]
      );      
  
      const [balanceResult] = await conn.execute(
        `SELECT SUM(
           CASE
             WHEN type = 'charge' THEN amount
             ELSE -amount
           END
         ) AS balance
         FROM transactions WHERE student_id = ?`,
        [studentId]
      );
  
      const balance = balanceResult[0].balance || 0;
  
      res.json({
        first_name: student.first_name,
        last_name: student.last_name,
        balance,
        transactions
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    } finally {
      conn.release();
    }
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

// Add transaction
app.post("/admin/transaction", async (req, res) => {
    const { student_id, type, amount } = req.body;
  
    if (!student_id || !type || isNaN(amount)) {
      return res.status(400).json({ error: "Missing required fields" });
    }
  
    const conn = await pool.getConnection();
  
    try {
      await conn.execute(
        "INSERT INTO transactions (student_id, type, amount) VALUES (?, ?, ?)",
        [student_id, type, amount]
      );
  
      res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
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
