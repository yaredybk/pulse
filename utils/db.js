// postgresdb
require('dotenv').config();
const Pool = require('pg').Pool;

class _pg {
  constructor(pgconfig) {
    this.pool = new Pool(pgconfig);
  }

  /**
   * @param  {...any} args - Arguments
   * @returns {Promise<{err,rows:Array}>}
   */
  async query(...args) {
    const client = await this.pool.connect();
    try {
      return await client.query(...args);
    } catch (err) {
      return { err,rows:[] };
    } finally {
      client.release();
    }
  }
}
const config = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};
const _db = new _pg(config);

/**
 *
 * @param {{iduser: number,uuid: string,name: string,gender: string,birth: string,country: string,city: string,phone: string,email: string,uname: string,idpass: number,bio: string,profile: string,active:number,created_at : string,updated_at : string,info:object}} user
 * @returns {Promise<{err, data:{iduser: number,uuid: string,name: string,gender: string,birth: string,country: string,city: string,phone: string,email: string,uname: string,idpass: number,bio: string,profile: string,active:number,created_at : string,updated_at : string,info:object}}>}
 */
async function updateUser(user) {
  const uniqueKeys = ['iduser', 'uuid', 'email', 'phone', 'uname'];
  const key = uniqueKeys.find((uk) => Object.hasOwn(user, uk));
  if (!key) return { err: 'no unique key found.' };
  const value = user[key];

  try {
    const s = await _db.pool.connect();
    let query = '';
    let values = [];
    delete user[key];
    let keys = Object.keys(user);
    if (keys.length == 0) {
      s.release();
      return { err: 'nodata' };
    }
    keys = keys.map((k, ind) => ` ${k} =  $${ind + 2}`).join(', ');
    values = [value, ...Object.values(user)];
    query = `update users set ${keys} where ${key} = $1 `;
    await s.query(query, values);
    const {
      rows: [result],
    } = await s.query(
      `select active, bio, city, country, email, gender, name, profile, uuid from users where ${key} = $1;`,
      [value],
    );
    await s.release();
    return { err: null, data: { ...user, ...result } };
  } catch (err) {
    // console.warn(err);
    return { err };
  }
}
/**
 *
 * @param {{iduser: number,uuid: string,name: string,gender: string,birth: string,country: string,city: string,phone: string,email: string,uname: string,idpass: number,bio: string,profile: string,active:number,created_at : string,updated_at : string,info:object}} user
 * @param {boolean} [withRooms=false] get rooms list in with return object
 * @returns {Promise<{err, data:{iduser: number,uuid: string,name: string,gender: string,birth: string,country: string,city: string,phone: string,email: string,uname: string,idpass: number,bio: string,profile: string,active:number,created_at : string,updated_at : string,info:object},rooms:Array<number> | undefined}>}
 */
async function upsertUser(user, withRooms = false) {
  const uniqueKeys = ['iduser', 'uuid', 'email', 'phone', 'uname'];
  const key = uniqueKeys.find((uk) => Object.hasOwn(user, uk));
  if (!key) return { err: 'no unique key found.' };
  const value = user[key];

  try {
    const s = await _db.pool.connect();
    const {
      rows: [result],
    } = await s.query(`select * from users where ${key} = $1;`, [value]);
    let query = '';
    let values = [];
    if (result) {
      // remove key, as it will be used in where clause
      delete user[key];
      let keys = Object.keys(user);
      if (keys.length == 0) {
        s.release();
        return { err: null, data: { ...user, ...result } };
      }
      keys = keys.map((k, ind) => ` ${k} =  $${ind + 2}`).join(', ');
      values = [value, ...Object.values(user)];
      query = `update users set ${keys} where ${key} = $1 `;
    } else {
      const keys = Object.keys(user).join(', ');
      const v = Object.keys(user)
        .map((_, i) => `$${i + 1}`)
        .join(', ');
      values = Object.values(user);
      query = `insert into users (${keys}) values ( ${v} )`;
    }
    const r = await s.query(query, values);
    const user_ = { ...user, ...result };
    if (withRooms) {
      const { rows: rooms } = await s.query(
        `select idroom from members where iduser = $1 order by idroom;`,
        user_.iduser,
      );
      await s.release();
      return { err: null, data: user_, rooms };
    }
    await s.release();
    return { err: null, data: user_ };
  } catch (err) {
    // console.warn(err);
    return { err };
  }
}
/**
 *
 * @param {{iduser: number,uuid: string,name: string,gender: string,birth: string,country: string,city: string,phone: string,email: string,uname: string,idpass: number,bio: string,profile: string,active:number,created_at : string,updated_at : string,info:object}} user
 * @returns {Promise<{err, data:{iduser: number,uuid: string,name: string,gender: string,birth: string,country: string,city: string,phone: string,email: string,uname: string,idpass: number,bio: string,profile: string,active:number,created_at : string,updated_at : string,info:object}}>}
 */
async function checkUser(user) {
  const uniqueKeys = ['iduser', 'uuid', 'email', 'phone', 'uname'];
  const key = uniqueKeys.find((uk) => Object.hasOwn(user, uk));
  if (!key) return { err: 'no unique key found.' };
  const value = user[key];
  try {
    const s = await _db.pool.connect();
    const {
      rows: [result],
    } = await s.query(`select * from users where ${key} = $1;`, [value]);
    if (result) {
      s.release();
      return { err: null, data: { ...user, ...result } };
    } else return { err: 'not found' };
  } catch (err) {
    return { err };
  }
}

/**
 * @param {Array<string>} uuids user uuids
 * @param {undefined} pool db pool connection can be undefined
 * @returns {Promise<Array<number>>}
 */
async function getUserIDs(uuids = [], pool) {
  let hadNoPool = false;
  if (!pool) {
    hadNoPool = true;
    pool = await _db.pool.connect();
  }
  const result = await Promise.all(
    uuids.map(async (i) => {
      const {
        rows: [u],
      } = await pool.query(`select iduser from users where uuid = $1`, [i]);
      return u?.iduser;
    }),
  ).catch(console.trace);
  if (hadNoPool) pool.release();
  return result;
}
module.exports._db = _db;
module.exports._upsertUser = upsertUser;
module.exports._getUserIDs = getUserIDs;
module.exports._checkUser = checkUser;
module.exports._updateUser = updateUser;
