const cors = require('cors');
const express = require('express');
const app = express();
const port = process.env.PORT;

if (port == null || port == "") {
  port = 8000;
}

const db = require('./database.js');

app.use(express.json()) 
app.use(cors());
app.options('*', cors());

const authentication = require('./auth.js');
const authenticate = authentication.authFunction;
app.use('/update', authenticate);

const updateRouter = require('./update.js');
app.use('/update', updateRouter);


const authRouter = authentication.router;
app.use('/auth', authRouter);


app.listen(port, () => {
  console.log(`Listening on port ${port}!`)
});

