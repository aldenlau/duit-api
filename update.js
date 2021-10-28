const express = require('express');
const router = express.Router();
const db = require('./database.js');

router.get('/tasks', async (req, res) => {
    db.query('SELECT * FROM tasks WHERE user_id=$1', [req.userId])
    .then(queryRes => res.json(queryRes.rows));
    }
);

router.post('/addtask', async (req, res) => {
    db.query('INSERT INTO tasks VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', 
        [req.userId, 
        req.body.time, 
        req.body.remainingTime, 
        req.body.title, 
        req.body.description, 
        req.body.priority, 
        req.body.startDate, 
        req.body.dueDate, 
        req.body.taskId])
    .then(_ => db.query('SELECT * FROM tasks WHERE user_id=$1', [req.userId]))
    .then(queryRes => res.json(queryRes.rows));
});

router.put('/deltask', async (req, res) => {
    db.query('BEGIN')
    .then(_ => db.query('INSERT INTO completed SELECT * FROM tasks WHERE user_id=$1 AND task_id=$2', [req.userId, req.body.taskId]))
    .then(_ => db.query('DELETE FROM tasks WHERE user_id=$1 AND task_id=$2', [req.userId, req.body.taskId]))
    .then(_ => db.query('COMMIT'))
    .then(_ => db.query('SELECT * FROM tasks WHERE user_id=$1', [req.userId]))
    .then(queryRes => res.json(queryRes.rows))
    .catch(e => {
        db.query('ROLLBACK');
    })
});

module.exports = router;