// Import the required modules
const express = require('express'); // Framework for building web applications
const db = require('./db'); // Import the database connection from db.js
const app = express(); // Create an instance of an Express application
const PORT = 3000; // Define the port on which the server will run

// Middleware to parse incoming JSON requests
app.use(express.json()); 

// Basic GET route to confirm the server is running
app.get('/', (req, res) => {
    res.send('Welcome to the Backend Task!'); // Respond with a welcome message
});

// POST /identify endpoint to handle contact information submissions
app.post('/identify', async (req, res) => {
    const { email, phoneNumber } = req.body; // Destructure email and phoneNumber from request body

    // Log the incoming request body for debugging purposes
    console.log('Received body:', req.body);

    // Validate that both email and phone number are provided
    if (!email || !phoneNumber) {
        return res.status(400).json({ error: "Email and phone number are required." }); // Send error response if validation fails
    }

    try {
        // Query the database for existing contacts matching the provided email or phone number
        const query = `SELECT * FROM contacts WHERE email = ? OR phoneNumber = ?`;
        const existingContacts = await new Promise((resolve, reject) => {
            db.all(query, [email, phoneNumber], (err, rows) => {
                if (err) reject(err); // Reject the promise if there is an error
                else resolve(rows); // Resolve the promise with the fetched rows
            });
        });

        // Check if no existing contacts were found
        if (existingContacts.length === 0) {
            // Insert a new primary contact if none exist
            const insertQuery = `INSERT INTO contacts (email, phoneNumber, linkPrecedence) VALUES (?, ?, "primary")`;
            const result = await new Promise((resolve, reject) => {
                db.run(insertQuery, [email, phoneNumber], function(err) {
                    if (err) reject(err); // Reject if there is an error in insertion
                    else resolve(this); // Resolve with the last inserted row ID
                });
            });

            // Return a response indicating a new primary contact has been created
            return res.status(200).json({
                primaryContactId: result.lastID, // ID of the newly created primary contact
                emails: [email], // Array containing the email of the new contact
                phoneNumbers: [phoneNumber], // Array containing the phone number of the new contact
                secondaryContactIds: [] // No secondary contacts for new entries
            });
        }

        // If existing contacts are found, determine the primary contact
        let primaryContact = existingContacts.find(contact => contact.linkPrecedence === "primary");
        if (!primaryContact) {
            primaryContact = existingContacts[0]; // Fallback to the first contact if no primary found
        }

        // Create Sets to collect unique emails and phone numbers
        const emails = new Set([primaryContact.email]);
        const phoneNumbers = new Set([primaryContact.phoneNumber]);
        const secondaryContactIds = []; // Array to hold IDs of secondary contacts

        // Loop through existing contacts to consolidate information
        existingContacts.forEach(contact => {
            if (contact.id !== primaryContact.id) { // Exclude the primary contact from this loop
                secondaryContactIds.push(contact.id); // Add secondary contact IDs

                // Add email and phone number to Sets if they exist
                if (contact.email) emails.add(contact.email);
                if (contact.phoneNumber) phoneNumbers.add(contact.phoneNumber);

                // If a primary contact is found that is not the true primary, convert it to secondary
                if (contact.linkPrecedence === "primary" && contact.id !== primaryContact.id) {
                    const updateQuery = `UPDATE contacts SET linkPrecedence = "secondary", linkedId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
                    db.run(updateQuery, [primaryContact.id, contact.id], (err) => {
                        if (err) console.error("Error updating contact link precedence:", err); // Log any update errors
                    });
                }
            }
        });

        // Return the consolidated data as a JSON response
        res.status(200).json({
            primaryContactId: primaryContact.id, // ID of the primary contact
            emails: Array.from(emails), // Array of unique emails
            phoneNumbers: Array.from(phoneNumbers), // Array of unique phone numbers
            secondaryContactIds // Array of secondary contact IDs
        });

    } catch (error) {
        console.error("Error handling request:", error); // Log any errors that occur during processing
        res.status(500).json({ message: "Internal Server Error" }); // Send a generic error response
    }
});

// Start the server and listen for incoming requests
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`); // Log the server start message
});
