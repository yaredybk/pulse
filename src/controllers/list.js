const express = require('express');
const TypeDef = require('../../sql/typeDef');
const { _db, _getUserIDs } = require('../../utils/db');

/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns
 */
exports.chat_content = async (req, res) => {
  /**
   * @type {{category: 'private' | 'room' | 'public' | 'me'}}
   */
  const { category, uuid } = req.params;
  const uuid2 = req.session.uuid;
  const iduser2 = req.session.iduser;
  const pool_ = await _db.pool.connect().catch((e) => {
    console.trace(e);
    res.sendStatus(500);
  });
  try {
    const [iduser1] = await _getUserIDs([uuid]);
    let { rows } = await pool_.query(
      `select idchat from chats \
      WHERE (iduser1 = $1 AND iduser2 = $2) or (iduser1 = $2 AND iduser2 = $1)`,
      [iduser1, iduser2],
    );
    /**
     * @type {TypeDef.Chat}}
     */
    let chat = rows[0];
    if (!chat) return res.send([]);
    let r_ = await pool_.query(
      `select * from (select idchat_text,content, created_at, updated_at, \
      (case when sender = $1 then $2 else $3 end) as uuid \
      from chat_text \
      WHERE idchat = $4 order by  idchat_text desc limit 50) as tmp order by idchat_text asc`,
      [iduser1, uuid, uuid2, chat.idchat],
    );
    pool_.release();
    return res.send(r_.rows);
  } catch (error) {
    console.warn(error);
    res.sendStatus(500);
    if (pool_.release) pool_.release();
  }
};

/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns
 */
exports.room_content = async (req, res) => {
  /**
   * @type {{category: 'private' | 'room' | 'public' | 'me'}}
   */
  const { category, uuid, idroom } = req.params;
  const uuid2 = req.session.uuid;
  const iduser = req.session.iduser;
  const pool_ = await _db.pool.connect().catch((e) => {
    console.trace(e);
    res.sendStatus(500);
  });
  try {
    let { rows } = await pool_.query(
      `select * from room_text
       join  members on room_text.idroom = members.idroom
       where members.iduser = $1 and members.idroom = $2;`,
      [iduser, idroom],
    );
    pool_.release();
    if (!rows || rows.length == 0) return res.sendStatus(401);
    return res.send(rows);
  } catch (error) {
    console.warn(error);
    res.sendStatus(500);
    if (pool_.release) pool_.release();
  }
};

/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns
 */
exports.chat_nav = async (req, res) => {
  /**
   * @type {{category: 'private' | 'room' | 'public' | 'me'}}
   */
  const { category } = req.params;
  const uuid = req.session.uuid;
  const iduser = req.session.iduser;

  try {
    let { err, rows } = await _db.query(
      `SELECT  c.idchat,c.count, u.name , u.uuid , u.email ,u.profile, u.active, c.created_at, c.updated_at \
     FROM (select idchat,count, created_at, updated_at, (case when iduser1 = $1 then iduser2 else iduser1 end) as \
     iduser from chats WHERE iduser1 = $1 or iduser2 = $1) as c JOIN users u ON (c.iduser = u.iduser) \
     order by  updated_at desc ;`,
      [iduser],
    );
    if (err) res.sendStatus(500);

    return res.send(rows);
  } catch (error) {
    console.warn(error);
    res.sendStatus(500);
  }
};
/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns
 */
exports.room_nav = async (req, res) => {
  /**
   * @type {{category: 'private' | 'room' | 'public' | 'me'}}
   */
  const { category } = req.params;
  const iduser = req.session.iduser;

  /**
   * @typedef {TypeDef.Room} rooms
   */
  try {
    let { err, rows } = await _db.query(
      `SELECT idroom,uuid,name,rname,admin,bio,profile,active from rooms \
      where idroom in (select idroom from members where iduser = $1);`,
      [iduser],
    );
    if (err) res.sendStatus(500);
    return res.send(rows);
  } catch (error) {
    console.warn(error);
    res.sendStatus(500);
  }
};
/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns
 */
exports.contacts_nav = async (req, res) => {
  /**
   * @type {{category: 'private' | 'room' | 'public' | 'me'}}
   */
  const { category } = req.params;
  const uuid = req.session.uuid;
  try {
    const a = await _db.query(`SELECT * FROM contact_global limit 50;`);
    return res.send(a.rows);
  } catch (error) {
    console.warn(error);
    res.sendStatus(500);
  }
};
