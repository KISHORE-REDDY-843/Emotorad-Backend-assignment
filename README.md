Project Overview
This project implements a backend web service for Emotorad to consolidate contact information (emails and phone numbers) across multiple purchases. The service identifies primary and secondary contacts to avoid duplicate entries, using an SQLite database for data management.
Prerequisites
Ensure the following are installed on your machine:
Node.js (v12 or higher)
SQLite3
1.Setup and Installation:
git clone https://github.com/your-username/backend-task-emotorad.git
cd backend-task-emotorad
2.Install dependencies:
Initialize Node.js:
Run the following command to create a package.json file:
npm init -y
Install Express for building the web server and SQLite for database management:
npm install express sqlite3
Set Up Project Structure:
Create a folder structure for the code:
mkdir src
cd src
touch app.js db.js
app.js will contain the main Express server code.
db.js will manage the database connection and set up the necessary tables
Database Schema:
The database includes a contacts table, created automatically with the following structure:
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phoneNumber TEXT,
  email TEXT,
  linkedId INTEGER,
  linkPrecedence TEXT CHECK(linkPrecedence IN ('primary', 'secondary')),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP
);
Running the Server
Start the server by running:
node app.js
Once the server is running, it will listen on port 3000:
Server is running on http://localhost:3000
API Endpoint and Usage
The service provides an endpoint at POST /identify that processes JSON payloads containing "email" and "phoneNumber" fields.

Endpoint: /identify
Method: POST
Request Body:
{
  "email": "example@example.com",
  "phoneNumber": "1234567890"
}
Response Structure
New Contact (when no existing contact matches):
{
  "primaryContactId": 5,
  "emails": ["example@example.com"],
  "phoneNumbers": ["1234567890"],
  "secondaryContactIds": []
}
Existing Contact (when matching contact found):
{
  "primaryContactId": 3,
  "emails": ["example@example.com", "other@example.com"],
  "phoneNumbers": ["1234567890", "0987654321"],
  "secondaryContactIds": [4, 5]
}
Testing the Service
You can test the service using Postman or curl.
Example Request for New Contact
Make a POST request to http://localhost:3000/identify with the following body:

{
  "email": "newuser@example.com",
  "phoneNumber": "1234567890"
}
This should return a new primaryContactId for the contact.
Example Request for Existing Contact
If the email or phone number already exists, the response will return consolidated contact details with primary and secondary contact IDs.
Error Handling
The application provides specific error responses:
400 Bad Request: Missing required fields (email or phoneNumber).
500 Internal Server Error: Unexpected server or database issues.

