const express = require('express');
const TypeDef = require('../../sql/typeDef');
const { _db, _upsertUser, _getUserIDs } = require('../../utils/db');

/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns
 */
exports.chat_content = async (req, res) => {
  /**
   * @type {{category: 'private' | 'room' | 'global' | 'me'}}
   */
  const { category, uuid } = req.params;
  const uuid2 = req.session.uuid;
  const pool_ = await _db.pool.connect().catch((e) => {
    console.trace(e);
    res.sendStatus(500);
  });
  try {
    const [iduser1, iduser2] = await _getUserIDs([uuid, uuid2]);
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
      `select idchat_text,content, created_at, updated_at, \
      (case when sender = $1 then $2 else $3 end) as uuid \
      from chat_text \
      WHERE idchat = $4`,
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
exports.chat_nav = async (req, res) => {
  /**
   * @type {{category: 'private' | 'room' | 'global' | 'me'}}
   */
  const { category } = req.params;
  const uuid = req.session.uuid;
  try {
    const [iduser] = await _getUserIDs([uuid]);
    let { rows } = await _db.query(
      `SELECT  c.idchat, u.name , u.uuid , u.email ,u.profile, c.created_at, c.updated_at \
     FROM (select idchat, created_at, updated_at, (case when iduser1 = $1 then iduser2 else iduser1 end) as \
     iduser from chats WHERE iduser1 = $1 or iduser2 = $1) as c JOIN users u ON (c.iduser = u.iduser) \;`,
      [iduser],
    );

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
   * @type {{category: 'private' | 'room' | 'global' | 'me'}}
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
