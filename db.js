const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./contacts.db', (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to the SQLite database.");

    db.run(`CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phoneNumber TEXT,
      email TEXT,
      linkedId INTEGER,
      linkPrecedence TEXT CHECK(linkPrecedence IN ('primary', 'secondary')),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deletedAt TIMESTAMP
    )`);
  }
});

module.exports = db; // Only export the db object
