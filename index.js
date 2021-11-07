const cors = require('cors');
const express = require('express');
const app = express();
const port = provess.env.PORT;

if (port == null || port == "") {
  port = 8000;
}

const bcrypt = require('bcryptjs');
const db = require('./database.js');

app.use(express.json()) 
app.use(cors());
app.options('*', cors());

async function authenticate(req, res, next) {
  db.query('SELECT user_id FROM users WHERE token=$1', [req.query.token])
  .then(queryRes => {
    if (queryRes.rows.length==0) {
      res.status(401);
      res.json({ error: 'Invalid token.'});
    }
    else {
      req.userId = queryRes.rows[0].user_id;
      next();
    }
  })
}


app.use('/update', authenticate);

const update = require('./update.js');
app.use('/update', update)

app.post('/register', async (req, res) => {
  db.query('SELECT user_id FROM users WHERE user_id=$1', [req.body.username])
  .then(async queryRes => {
      if (queryRes.rows.length!=0) {
        res.status(401);
        res.json({error: 'Username already taken.'});
      }
      else {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        const token = await bcrypt.hash(req.body.username + Date.now(), salt)
        db.query('INSERT INTO users VALUES ($1, $2, $3)', [req.body.username, hashedPassword, token])
        .catch(e => console.error(e.stack));
        res.status(201);
        res.json({token: token});
      }
  })
  .catch(e => console.error(e.stack));


});

app.get('/login', async (req, res) => {
    db.query('SELECT password, token FROM users WHERE user_id=$1', [req.query.username])
    .then(async queryRes => {
      if (queryRes.rows.length==0) {
        res.status(401);
        res.json({ error: 'Incorrect username.'});
      }
      else if (await bcrypt.compare(req.query.password, queryRes.rows[0].password)) {
          res.json({token: queryRes.rows[0].token});
      }
      else {
        res.status(401);
        res.json({ error: 'Incorrect password.'});
      }
    })
    .catch(e => console.error(e.stack));
});


app.listen(port, () => {
  console.log(`Listening on port ${port}!`)
});

