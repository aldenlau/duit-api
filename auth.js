// TODO: Migrate Google sign-in
const express = require('express');
const router = express.Router();
const db = require('./database.js');
const bcrypt = require('bcryptjs');
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client(process.env.CLIENT_ID);

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

router.post('/register', async (req, res) => {
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
          db.query('INSERT INTO users VALUES ($1, $2, $3, $4, $5)', [req.body.username, hashedPassword, token, null, false])
          .catch(e => console.error(e.stack));
          res.status(201);
          res.json({token: token});
        }
    })
    .catch(e => console.error(e.stack));
});
  
router.get('/login', async (req, res) => {
    db.query('SELECT password, token, use_google FROM users WHERE user_id=$1', [req.query.username])
    .then(async queryRes => {
    if (queryRes.rows.length==0) {
        res.status(401);
        res.json({ error: 'Incorrect username.'});
    }
    else if (queryRes.rows[0].use_google==true) {
        res.status(401);
        res.json({ error: 'This account uses Google sign-in.'});
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
  
router.post('/login-google', async (req, res) => {
    const ticket = await client.verifyIdToken({
        idToken: req.body.token,
        audience: process.env.CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload['email'];
    db.query('SELECT token, use_google FROM users WHERE user_id=$1', [email])
    .then(async queryRes => {
        if (queryRes.rows.length==0) {
            const salt = await bcrypt.genSalt();
            const token = await bcrypt.hash(email + Date.now(), salt)
            db.query('INSERT INTO users VALUES ($1, $2, $3, $4, $5)', [email, null, token, email, true])
            .then(_ => {
                res.status(201);
                res.json({token: token});
            })
            .catch(e => console.error(e.stack));
        }
        else {
            db.query('UPDATE users SET use_google=TRUE WHERE user_id=$1', [email])
            .then(_ => {
                console.log(queryRes.rows[0].token);
                res.json({token: queryRes.rows[0].token});
            })
            .catch(e => console.error(e.stack));
        }
    })
});

exports.router = router;
exports.authFunction = authenticate;