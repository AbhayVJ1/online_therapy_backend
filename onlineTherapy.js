import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import autenticationRoute from './routes/authenticationRoutes.js';
import { db } from './config/dbConfig.js';

dotenv.config();
const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') {
        res.header('ACCESS-CONTROL-ALLOW-METHODS', 'PUT, POST, PATCH, GET, DELETE');
        return res.status(200).json({});
    }
    next();
});

app.post('/online_therapy/store-student', (req, res) => {
    const { student_id, student_email, user_id } = req.body;

    // Check if the student_id already exists
    const checkSql = 'SELECT * FROM student_questionnaire WHERE student_id = ?';
    db.query(checkSql, [student_id], (err, results) => {
        if (err) {
            console.error('Error checking for existing student ID:', err);
            res.status(500).json({ status: 500, message: 'Error checking for existing student ID' });
            return;
        }

        if (results.length > 0) {
            // Student ID exists, perform an update
            const updateSql = `
              UPDATE student_questionnaire
              SET student_email = ?, user_id = ?
              WHERE student_id = ?
            `;
            db.query(updateSql, [student_email, user_id, student_id], (err, result) => {
                if (err) {
                    console.error('Error updating student data:', err);
                    res.status(500).json({ status: 500, message: 'Failed to update student data' });
                    return;
                }
                console.log('Updated student data:', result);
                res.status(200).json({ status: 200, message: 'Student data updated successfully' });
            });
        } else {
            // Student ID does not exist, perform an insert
            const insertSql = `
              INSERT INTO student_questionnaire (student_id, student_email, user_id)
              VALUES (?, ?, ?)
            `;
            db.query(insertSql, [student_id, student_email, user_id], (err, result) => {
                if (err) {
                    console.error('Error inserting into student_questionnaire table:', err);
                    res.status(500).json({ status: 500, message: 'Failed to insert student data' });
                    return;
                }
                console.log('Inserted student data:', result);
                res.status(200).json({ status: 200, message: 'Student data stored successfully' });
            });
        }
    });
});



// API 2: Update Part A Questionnaire
app.post('/online_therapy/update-part-a', (req, res) => {
    const { student_id, paq1, paq2, paq3, paq4, paq5, paq6, paq7, paq8, paq9, paq10, paq11, paq12, paq13, paq14, paq15 } = req.body;

    const sql = `
      UPDATE student_questionnaire
      SET paq1 = ?, paq2 = ?, paq3 = ?, paq4 = ?, paq5 = ?, paq6 = ?, paq7 = ?, paq8 = ?, paq9 = ?, paq10 = ?, paq11 = ?, paq12 = ?, paq13 = ?, paq14 = ?, paq15 = ?
      WHERE student_id = ?
    `;
    const values = [paq1, paq2, paq3, paq4, paq5, paq6, paq7, paq8, paq9, paq10, paq11, paq12, paq13, paq14, paq15, student_id];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error updating part A questionnaire:', err);
            res.status(500).json({ status: 500, message: 'Failed to update part A questionnaire' });
            return;
        }
        console.log('Updated part A questionnaire:', result);
        res.status(200).json({ status: 200, message: 'Part A questionnaire updated successfully' });
    });
});

// API 3: Update Part B Questionnaire
app.post('/online_therapy/update-part-b', (req, res) => {
    const { student_id, pbq1, pbq2, pbq3, pbq4, pbq5, pbq6, pbq7, pbq8, pbq9, pbq10, pbq11, pbq12 } = req.body;

    const sql = `
      UPDATE student_questionnaire
      SET pbq1 = ?, pbq2 = ?, pbq3 = ?, pbq4 = ?, pbq5 = ?, pbq6 = ?, pbq7 = ?, pbq8 = ?, pbq9 = ?, pbq10 = ?, pbq11 = ?, pbq12 = ?
      WHERE student_id = ?
    `;
    const values = [pbq1, pbq2, pbq3, pbq4, pbq5, pbq6, pbq7, pbq8, pbq9, pbq10, pbq11, pbq12, student_id];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error updating part B questionnaire:', err);
            res.status(500).json({ status: 500, message: 'Failed to update part B questionnaire' });
            return;
        }
        console.log('Updated part B questionnaire:', result);
        res.status(200).json({ status: 200, message: 'Part B questionnaire updated successfully' });
    });
});


// API to get all student IDs and emails
app.get('/online_therapy/get-students', (req, res) => {
    const sql = 'SELECT student_id, student_email FROM student_questionnaire';

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error retrieving students:', err);
            res.status(500).json({ status: 500, message: 'Failed to retrieve students' });
            return;
        }
        res.status(200).json(results);
    });
});

// API endpoint to get student responses
app.get('/online_therapy/get-responses/:studentId', (req, res) => {
    const studentId = req.params.studentId;

    const sql = `
      SELECT 
        sq.*, 
        u.school_name,
        u.user_id,
        sq.student_email AS user_email
      FROM student_questionnaire sq
      JOIN user u ON sq.user_id = u.user_id
      WHERE sq.student_id = ?
    `;

    db.query(sql, [studentId], (err, results) => {
        if (err) {
            console.error('Error fetching responses:', err);
            res.status(500).json({ status: 500, message: 'Failed to fetch responses' });
            return;
        }

        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(404).json({ status: 404, message: 'No responses found for this student' });
        }
    });
});

app.get('/notifications/user/:userId', (req, res) => {
    const { userId } = req.params;

    // SQL query to get notifications by user ID
    const sql = 'SELECT * FROM notifications WHERE user_id = ?';

    // Execute the query
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching notifications:', err);
            res.status(500).json({ error: 'Failed to fetch notifications' });
            return;
        }
        // Send the results as JSON
        res.json(results);
    });
});

app.post('/notifications', (req, res) => {
    const { user_id, student_id, schedule_date, schedule_time, meeting_url } = req.body;

    if (!user_id || !student_id || !schedule_date || !schedule_time || !meeting_url) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    const checkSql = `
      SELECT * FROM notifications
      WHERE user_id = ? AND student_id = ?
    `;
    
    db.query(checkSql, [user_id, student_id], (err, results) => {
        if (err) {
            console.error('Error checking for existing notification:', err);
            return res.status(500).json({ message: 'Failed to check for existing notification' });
        }

        if (results.length > 0) {
            // Record exists, perform an update
            const updateSql = `
              UPDATE notifications
              SET schedule_date = ?, schedule_time = ?, meeting_url = ?
              WHERE user_id = ? AND student_id = ?
            `;

            db.query(updateSql, [schedule_date, schedule_time, meeting_url, user_id, student_id], (err, result) => {
                if (err) {
                    console.error('Error updating notification:', err);
                    return res.status(500).json({ message: 'Failed to update notification' });
                }
                res.status(200).json({ message: 'Notification updated successfully' });
            });
        } else {
            // Record does not exist, perform an insert
            const insertSql = `
              INSERT INTO notifications (user_id, student_id, schedule_date, schedule_time, meeting_url)
              VALUES (?, ?, ?, ?, ?)
            `;

            db.query(insertSql, [user_id, student_id, schedule_date, schedule_time, meeting_url], (err, result) => {
                if (err) {
                    console.error('Error inserting notification:', err);
                    return res.status(500).json({ message: 'Failed to create notification' });
                }
                res.status(201).json({ message: 'Notification created successfully', notificationId: result.insertId });
            });
        }
    });
});


app.post('/contact', (req, res) => {
    const { name, email, message } = req.body;
    const sql = 'INSERT INTO ContactUs (name, email_id, message) VALUES (?, ?, ?)';
    db.query(sql, [name, email, message], (err, result) => {
        if (err) {
            console.error('Error inserting into ContactUs table:', err);
            res.status(500).json({ status: 500, message: 'Failed to insert into ContactUs table' });
            return;
        }
        console.log('Inserted into ContactUs table:', result);
        res.status(200).json({ status: 200, message: 'Contact details inserted successfully' });
    });
});

app.use('/online_therapy/autenticate', autenticationRoute);
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server connected to port ${PORT}`);
});
