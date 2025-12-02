const fs = require('fs')
const path = require('path')

const src = process.argv[2]
if (!src) { process.stderr.write('Usage: node scripts/restore.js <backup_file>\n'); process.exit(1) }
if (!fs.existsSync(src)) { process.stderr.write('Backup not found\n'); process.exit(1) }
const dbPath = path.join(__dirname, '..', 'data', 'barangaylink.db')
fs.copyFileSync(src, dbPath)
process.stdout.write('Restored\n')

