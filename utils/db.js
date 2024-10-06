// postgresdb
require('dotenv').config();
const { Pool } = require('pg');

class _pg {
  constructor(pgconfig) {
    this.pool = new Pool(pgconfig);
  }

  async query(...args) {
    return new Promise((rs, rj) =>
      this.pool.connect().then((c) => {
        c.query(...args)
          .then((r) => {
            c.release();
            rs(r);
          })
          .catch((e) => {
            console.warn('-pg-query\n',e);
            c.release();
            rj(new Error('query failed'));
          });
      })
    );
  }
}
const config = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};
module.exports._db = new _pg(config);
