const express = require('express');
const db = require('./db'); // Import the database connection
const app = express();
const PORT = 3000;

app.use(express.json()); // Middleware to parse JSON requests

app.get('/', (req, res) => {
    res.send('Welcome to the Backend Task!');
});

app.post('/identify', async (req, res) => {
    const { email, phoneNumber } = req.body;

    // Log the incoming request body for debugging
    console.log('Received body:', req.body);

    // Validate input
    if (!email || !phoneNumber) {
        return res.status(400).json({ error: "Email and phone number are required." });
    }

    try {
        // Query for existing contacts with the same email or phone number
        const query = `SELECT * FROM contacts WHERE email = ? OR phoneNumber = ?`;
        const existingContacts = await new Promise((resolve, reject) => {
            db.all(query, [email, phoneNumber], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        // Non-existing contact scenario: Create a new primary contact
        if (existingContacts.length === 0) {
            const insertQuery = `INSERT INTO contacts (email, phoneNumber, linkPrecedence) VALUES (?, ?, "primary")`;
            const result = await new Promise((resolve, reject) => {
                db.run(insertQuery, [email, phoneNumber], function(err) {
                    if (err) reject(err);
                    else resolve(this);
                });
            });

            return res.status(200).json({
                primaryContactId: result.lastID,
                emails: [email],
                phoneNumbers: [phoneNumber],
                secondaryContactIds: []
            });
        }

        let primaryContact = existingContacts.find(contact => contact.linkPrecedence === "primary");
        if (!primaryContact) {
            primaryContact = existingContacts[0]; // Fallback to first contact if no primary found
        }
        
        // Use Set to avoid duplicates
        const emails = new Set([primaryContact.email]);
        const phoneNumbers = new Set([primaryContact.phoneNumber]);
        const secondaryContactIds = [];
        
        existingContacts.forEach(contact => {
            if (contact.id !== primaryContact.id) {
                secondaryContactIds.push(contact.id);
                if (contact.email) emails.add(contact.email);
                if (contact.phoneNumber) phoneNumbers.add(contact.phoneNumber);
        
                // Convert other primary contacts to secondary and link them to the true primary
                if (contact.linkPrecedence === "primary" && contact.id !== primaryContact.id) {
                    const updateQuery = `UPDATE contacts SET linkPrecedence = "secondary", linkedId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
                    db.run(updateQuery, [primaryContact.id, contact.id], (err) => {
                        if (err) console.error("Error updating contact link precedence:", err);
                    });
                }
            }
        });

        // Return consolidated data
        res.status(200).json({
            primaryContactId: primaryContact.id,
            emails: Array.from(emails),
            phoneNumbers: Array.from(phoneNumbers),
            secondaryContactIds
        });

    } catch (error) {
        console.error("Error handling request:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
