const { _db, _getUserIDs } = require('./db');
const typeDef = require('../sql/typeDef.js');

/**
 * process all kinds of datas transmitted over websocket
 * @param {string} data message data
 * @param {string} root root path like /api
 * @param {'chat' | 'contact' | 'search'} type data type [chat, contact, search]
 * @param {'private' | 'room' | 'global'} category privacy indicator like [private, room, global]
 * @param {string} touuid receiver uuid
 * @param {string} fromuuid sender uuid
 * @param {Function} cb callback function
 * @returns {void}
 */
function storeWSdata(
  data,
  root,
  type,
  category,
  touuid,
  fromuuid,
  cb = () => null,
) {
  // root is ignored for now
  switch (type) {
    case 'chat':
      return storeChat(data, category, touuid, fromuuid, cb);

    default:
      console.warn('UNHANDLED storeWSdata', type);
      break;
  }
}

/**
 * process all chats transmitted over websocket
 * @param {string} data message data
 * @param {'private' | 'room' | 'global'} category privacy indicator like [private, room, global]
 * @param {string} touuid receiver uuid
 * @param {string} fromuuid sender uuid
 * @param {Function} cb callback function
 * @returns {void}
 */
async function storeChat(
  data,
  category,
  touuid,
  fromuuid,
  cb = (err, data) => null,
) {
  const pool_ = await _db.pool.connect().catch((e) => {
    console.trace(e);
    res.sendStatus(500);
  });
  try {
    const [iduser1, iduser2] = await _getUserIDs([fromuuid, touuid], pool_);

    /**
     * @type {typeDef.Chat}
     */
    const chat_info = { iduser1, iduser2 };

    let results = await pool_.query(
      `select idchat from chats where (iduser1 = $1 and iduser2 = $2) or \
                                 (iduser1 = $2 and iduser2 = $1) ;`,
      [chat_info.iduser1, chat_info.iduser2],
    );
    if (results.rows.length == 0)
      results = await pool_.query(
        `insert into chats (iduser1, iduser2) values ($1, $2) RETURNING idchat;`,
        [chat_info.iduser1, chat_info.iduser2],
      );
    const {
      rows: [{ idchat }],
    } = results;
    /**
     * @type {typeDef.ChatText}
     */
    const message_ = { content: data, idchat: idchat, sender: iduser1 };
    const result2 = await pool_.query(
      `insert into chat_text (${Object.keys(message_).join(', ')}) values ($1, $2, $3) RETURNING idchat_text;`,
      Object.values(message_),
    );
    const {
      rows: [{ idchat_text }],
    } = result2;
    pool_.release();
    cb(null, { idchat, idchat_text, fromuuid, touuid });
  } catch (error) {
    cb(error);
    if (pool_.release) pool_.release();
  }
}
module.exports = { storeWSdata };
