const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const cookieParser = require('cookie-parser')
const express = require('express')
const db = require('./db')

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

function issueToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' })
}

function authMiddleware(req, res, next) {
  const token = req.cookies.token
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
    if (req.user.role !== role) return res.status(403).json({ error: 'Forbidden' })
    next()
  }
}

const router = express.Router()
router.use(express.json())
router.use(cookieParser())

router.post('/login', (req, res) => {
  const { username, password } = req.body
  const userRow = db.prepare('SELECT * FROM Users WHERE username = ?').get(username)
  if (!userRow) return res.status(401).json({ error: 'Invalid credentials' })
  const ok = bcrypt.compareSync(password, userRow.password)
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
  const token = issueToken({ user_ID: userRow.user_ID, role: userRow.role, staff_ID: userRow.staff_ID, username: userRow.username })
  res.cookie('token', token, { httpOnly: true })
  return res.json({ ok: true, role: userRow.role, username: userRow.username })
})

router.post('/logout', (req, res) => {
  res.clearCookie('token')
  res.json({ ok: true })
})

function seedAdmin() {
  const count = db.prepare('SELECT COUNT(*) as c FROM Users').get().c
  if (count === 0) {
    const saltRounds = 10
    const hash = bcrypt.hashSync('admin123', saltRounds)
    db.prepare('INSERT INTO Users (username, password, role, staff_ID) VALUES (?,?,?,NULL)').run('admin', hash, 'admin')
  }
}

seedAdmin()

module.exports = { authRouter: router, authMiddleware, requireRole }

