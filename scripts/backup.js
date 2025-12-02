const fs = require('fs')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'barangaylink.db')
const backupsDir = path.join(__dirname, '..', 'data', 'backups')
if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true })
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const target = path.join(backupsDir, `barangaylink-${stamp}.db`)
fs.copyFileSync(dbPath, target)
process.stdout.write(target)

