const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const dataDir = path.join(__dirname, '..', 'data')
const dbFile = path.join(dataDir, 'barangaylink.db')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const db = new Database(dbFile)
db.pragma('foreign_keys = ON')

const migDir = path.join(__dirname, 'migrations')
if (!fs.existsSync(migDir)) fs.mkdirSync(migDir, { recursive: true })
db.exec(`CREATE TABLE IF NOT EXISTS Migrations (id TEXT PRIMARY KEY, applied_at DATETIME NOT NULL)`)
const applied = new Set(db.prepare('SELECT id FROM Migrations').all().map(r => r.id))
const files = fs.readdirSync(migDir).filter(f => f.endsWith('.sql')).sort()
for (const f of files) {
  const id = f.replace(/\.sql$/, '')
  if (applied.has(id)) continue
  const sql = fs.readFileSync(path.join(migDir, f), 'utf-8')
  db.exec(sql)
  db.prepare("INSERT INTO Migrations (id, applied_at) VALUES (?, datetime('now'))").run(id)
}

module.exports = db

