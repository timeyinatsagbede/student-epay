const http = require('http');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { URL } = require('url');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'your_mysql_user',
  password: 'your_mysql_password',
  database: 'student_finance',
});

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);

  // Serve static files
  if (req.method === 'GET' && parsedUrl.pathname === '/') {
    fs.readFile('./public/index.html', (err, data) => {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading page.');
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  // Handle /admin/add-student
  if (req.method === 'POST' && parsedUrl.pathname === '/admin/add-student') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { first_name, last_name, student_id, initial_transaction } = JSON.parse(body);
        if (!first_name || !last_name || !student_id || !initial_transaction?.type || !initial_transaction?.amount) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Missing required fields' }));
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
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (err) {
          await conn.rollback();
          if (err.code === 'ER_DUP_ENTRY') {
            res.writeHead(409, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Student ID already exists' }));
          } else {
            console.error(err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
          }
        } finally {
          conn.release();
        }
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Fallback for unknown routes
  res.writeHead(404);
  res.end('Not found');
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
