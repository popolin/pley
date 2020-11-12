import faunadb from 'faunadb';

console.log(`process.env.DB_KEY: ${process.env.REACT_APP_DB_KEY}`);
const client = new faunadb.Client({
  secret: process.env.REACT_APP_DB_KEY || '',
});

const q = faunadb.query;
export { client, q };
