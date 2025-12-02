const express = require('express')
const path = require('path')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const db = require('./db')
const { authRouter, authMiddleware, requireRole } = require('./auth')

const app = express()
app.use(cors({ origin: true, credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRouter)

app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ user: req.user })
})

app.get('/api/reports/requests.csv', authMiddleware, (req, res) => {
  const { from, to, service_ID } = req.query
  let where = []
  let params = []
  if (from) { where.push('r.date_Requested >= ?'); params.push(from) }
  if (to) { where.push('r.date_Requested <= ?'); params.push(to) }
  if (service_ID) { where.push('r.service_ID = ?'); params.push(Number(service_ID)) }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const rows = db.prepare(`
    SELECT r.request_ID, res.name AS resident_name, s.service_Type, r.date_Requested, r.status
    FROM Requests r JOIN Residents res ON r.resident_ID=res.resident_ID JOIN Services s ON r.service_ID=s.service_ID
    ${whereSql}
    ORDER BY r.date_Requested DESC
  `).all(...params)
  const header = ['request_ID','resident_name','service_Type','date_Requested','status']
  const csv = [header.join(',')].concat(rows.map(r => `${r.request_ID},"${r.resident_name}","${r.service_Type}",${r.date_Requested},${r.status}`)).join('\n')
  res.setHeader('Content-Type','text/csv')
  res.send(csv)
})

app.use(express.static(path.join(__dirname, '..', 'public')))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'))
})

// Users (admin only)
app.get('/api/users', authMiddleware, requireRole('admin'), (req, res) => {
  const users = db.prepare('SELECT user_ID, username, role, staff_ID FROM Users').all()
  res.json(users)
})

app.post('/api/users', authMiddleware, requireRole('admin'), (req, res) => {
  const { username, password, role, staff_ID } = req.body
  if (!username || !password || !role) return res.status(400).json({ error: 'Missing fields' })
  const bcrypt = require('bcrypt')
  const hash = bcrypt.hashSync(password, 10)
  try {
    const info = db.prepare('INSERT INTO Users (username, password, role, staff_ID) VALUES (?,?,?,?)').run(username, hash, role, staff_ID || null)
    res.json({ user_ID: info.lastInsertRowid })
  } catch (e) {
    res.status(400).json({ error: 'Username already exists' })
  }
})

app.delete('/api/users/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const id = Number(req.params.id)
  const info = db.prepare('DELETE FROM Users WHERE user_ID = ?').run(id)
  res.json({ deleted: info.changes })
})

// Staffs
app.get('/api/staffs', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT * FROM Staffs').all()
  res.json(rows)
})

app.post('/api/staffs', authMiddleware, requireRole('admin'), (req, res) => {
  const { name, role } = req.body
  const info = db.prepare('INSERT INTO Staffs (name, role) VALUES (?, ?)').run(name, role)
  res.json({ staff_ID: info.lastInsertRowid })
})

app.put('/api/staffs/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const id = Number(req.params.id)
  const { name, role } = req.body
  const info = db.prepare('UPDATE Staffs SET name=?, role=? WHERE staff_ID=?').run(name, role, id)
  res.json({ updated: info.changes })
})

app.delete('/api/staffs/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const id = Number(req.params.id)
  const assignments = db.prepare('SELECT COUNT(*) as c FROM Assignments WHERE staff_ID=?').get(id).c
  if (assignments > 0) return res.status(400).json({ error: 'Cannot delete staff with assignments' })
  const info = db.prepare('DELETE FROM Staffs WHERE staff_ID=?').run(id)
  res.json({ deleted: info.changes })
})

// Residents
app.get('/api/residents', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT * FROM Residents').all()
  res.json(rows)
})

app.post('/api/residents', authMiddleware, (req, res) => {
  const { name, address, birth_Date, contact_Number } = req.body
  const info = db.prepare('INSERT INTO Residents (name, address, birth_Date, contact_Number) VALUES (?,?,?,?)').run(name, address, birth_Date, contact_Number)
  res.json({ resident_ID: info.lastInsertRowid })
})

app.put('/api/residents/:id', authMiddleware, (req, res) => {
  const id = Number(req.params.id)
  const { name, address, birth_Date, contact_Number } = req.body
  const info = db.prepare('UPDATE Residents SET name=?, address=?, birth_Date=?, contact_Number=? WHERE resident_ID=?').run(name, address, birth_Date, contact_Number, id)
  res.json({ updated: info.changes })
})

app.delete('/api/residents/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const id = Number(req.params.id)
  const info = db.prepare('DELETE FROM Residents WHERE resident_ID=?').run(id)
  res.json({ deleted: info.changes })
})

// Services
app.get('/api/services', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT * FROM Services').all()
  res.json(rows)
})

app.post('/api/services', authMiddleware, requireRole('admin'), (req, res) => {
  const { service_Type, description } = req.body
  const info = db.prepare('INSERT INTO Services (service_Type, description) VALUES (?,?)').run(service_Type, description || null)
  res.json({ service_ID: info.lastInsertRowid })
})

app.put('/api/services/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const id = Number(req.params.id)
  const { service_Type, description } = req.body
  const info = db.prepare('UPDATE Services SET service_Type=?, description=? WHERE service_ID=?').run(service_Type, description || null, id)
  res.json({ updated: info.changes })
})

app.delete('/api/services/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const id = Number(req.params.id)
  const info = db.prepare('DELETE FROM Services WHERE service_ID=?').run(id)
  res.json({ deleted: info.changes })
})

// Requests
app.get('/api/requests', authMiddleware, (req, res) => {
  const rows = db.prepare(`
    SELECT r.request_ID, r.resident_ID, res.name as resident_name, r.service_ID, s.service_Type,
           r.date_Requested, r.status
    FROM Requests r
    JOIN Residents res ON r.resident_ID = res.resident_ID
    JOIN Services s ON r.service_ID = s.service_ID
    ORDER BY r.date_Requested DESC
  `).all()
  res.json(rows)
})

app.post('/api/requests', authMiddleware, (req, res) => {
  const { resident_ID, service_ID, date_Requested, status } = req.body
  const info = db.prepare('INSERT INTO Requests (resident_ID, service_ID, date_Requested, status) VALUES (?,?,?,?)')
    .run(resident_ID, service_ID, date_Requested, status)
  res.json({ request_ID: info.lastInsertRowid })
})

app.put('/api/requests/:id/status', authMiddleware, (req, res) => {
  if (req.user.role !== 'staff' && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
  const id = Number(req.params.id)
  const { status } = req.body
  const info = db.prepare('UPDATE Requests SET status=? WHERE request_ID=?').run(status, id)
  res.json({ updated: info.changes })
})

app.delete('/api/requests/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const id = Number(req.params.id)
  const info = db.prepare('DELETE FROM Requests WHERE request_ID=?').run(id)
  res.json({ deleted: info.changes })
})

// Assignments
app.get('/api/assignments', authMiddleware, (req, res) => {
  const rows = db.prepare(`
    SELECT a.assignment_ID, a.request_ID, a.staff_ID, a.date_Assigned,
           s.name as staff_name, r.status, r.date_Requested
    FROM Assignments a
    JOIN Staffs s ON a.staff_ID = s.staff_ID
    JOIN Requests r ON a.request_ID = r.request_ID
    ORDER BY a.date_Assigned DESC
  `).all()
  res.json(rows)
})

app.post('/api/assignments', authMiddleware, (req, res) => {
  const { request_ID, staff_ID, date_Assigned } = req.body
  const info = db.prepare('INSERT INTO Assignments (request_ID, staff_ID, date_Assigned) VALUES (?,?,?)').run(request_ID, staff_ID, date_Assigned)
  res.json({ assignment_ID: info.lastInsertRowid })
})

app.delete('/api/assignments/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const id = Number(req.params.id)
  const info = db.prepare('DELETE FROM Assignments WHERE assignment_ID=?').run(id)
  res.json({ deleted: info.changes })
})

// Reports
app.get('/api/reports/summary', authMiddleware, (req, res) => {
  const { from, to, service_ID } = req.query
  let where = []
  let params = []
  if (from) { where.push('date_Requested >= ?'); params.push(from) }
  if (to) { where.push('date_Requested <= ?'); params.push(to) }
  if (service_ID) { where.push('service_ID = ?'); params.push(Number(service_ID)) }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const total = db.prepare(`SELECT COUNT(*) as c FROM Requests ${whereSql}`).get(...params).c
  const compWhereSql = where.length ? `${whereSql} AND status='Completed'` : `WHERE status='Completed'`
  const completed = db.prepare(`SELECT COUNT(*) as c FROM Requests ${compWhereSql}`).get(...params).c
  res.json({ total_requests: total, completed_requests: completed })
})

if (process.argv.includes('--migrate-only')) {
  process.exit(0)
}

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`BarangayLink server running on http://localhost:${PORT}`)
})

