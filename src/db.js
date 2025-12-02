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

db.exec(`
CREATE TABLE IF NOT EXISTS Staffs (
  staff_ID INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS Users (
  user_ID INTEGER PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','staff')),
  staff_ID INTEGER,
  FOREIGN KEY(staff_ID) REFERENCES Staffs(staff_ID)
);

CREATE TABLE IF NOT EXISTS Residents (
  resident_ID INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address VARCHAR(255) NOT NULL,
  birth_Date DATE NOT NULL,
  contact_Number VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS Services (
  service_ID INTEGER PRIMARY KEY,
  service_Type VARCHAR(100) NOT NULL,
  description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS Requests (
  request_ID INTEGER PRIMARY KEY,
  resident_ID INTEGER NOT NULL,
  service_ID INTEGER NOT NULL,
  date_Requested DATETIME NOT NULL,
  status VARCHAR(50) NOT NULL CHECK(status IN ('Pending','In Progress','Completed')),
  FOREIGN KEY(resident_ID) REFERENCES Residents(resident_ID) ON DELETE CASCADE,
  FOREIGN KEY(service_ID) REFERENCES Services(service_ID)
);

CREATE TABLE IF NOT EXISTS Assignments (
  assignment_ID INTEGER PRIMARY KEY,
  request_ID INTEGER NOT NULL,
  staff_ID INTEGER NOT NULL,
  date_Assigned DATE NOT NULL,
  FOREIGN KEY(request_ID) REFERENCES Requests(request_ID) ON DELETE CASCADE,
  FOREIGN KEY(staff_ID) REFERENCES Staffs(staff_ID)
);
`)

module.exports = db

