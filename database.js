const { Client } = require('pg');
const client = new Client({
  user: 'alden',
  host: 'localhost',
  database: 'mydb',
  password: 'sugar101',
  port:5432
});
client.connect();

module.exports = {
    query: (text, params) => {
      return client.query(text, params)
    },
  }