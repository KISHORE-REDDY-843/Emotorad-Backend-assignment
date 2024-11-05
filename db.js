// Import the SQLite3 module
const sqlite3 = require('sqlite3').verbose();

// Connect to the SQLite database or create it if it doesn't exist
const db = new sqlite3.Database('./contacts.db', (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to the SQLite database.");

    // Create the contacts table if it does not exist
    db.run(`CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,              -- Unique identifier for each contact
      phoneNumber TEXT,                                  -- Contact's phone number
      email TEXT,                                        -- Contact's email address
      linkedId INTEGER,                                  -- ID of the primary contact linked to this contact
      linkPrecedence TEXT CHECK(linkPrecedence IN ('primary', 'secondary')), -- Determines if the contact is primary or secondary
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,     -- Timestamp when the contact was created
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,     -- Timestamp for last update of the contact
      deletedAt TIMESTAMP                                -- Timestamp for when the contact was deleted (optional)
    )`);
  }
});

// Export the database connection
module.exports = db;
