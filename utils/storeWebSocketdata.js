const { _db, _getUserIDs } = require('./db');
const typeDef = require('../sql/typeDef.js');

/**
 * process all kinds of datas transmitted over websocket
 * @param {string} data message data
 * @param {string} root root path like /api
 * @param {'chat' | 'contact' | 'search'} type data type [chat, contact, search]
 * @param {'private' | 'room' | 'public'} category privacy indicator like [private, room, public]
 * @param {string} touuid receiver uuid
 * @param {string} from sender iduser
 * @param {Function} cb callback function
 * @returns {void}
 */
function storeWSdata(
  data,
  root,
  type,
  category,
  to_,
  from,
  cb = () => null,
) {
  // root is ignored for now
  switch (type) {
    case 'chat':
      return storeChat(data, to_, from, cb);
    case 'room':
      return storeRoomChat({content:data,idroom:to_,sender:from}, cb);

    default:
      console.warn('UNHANDLED storeWSdata', type);
      break;
  }
}

/**
 * process all chats transmitted over websocket
 * @param {string} data message data
 * @param {string} touuid receiver uuid
 * @param {string} iduser1 sender iduser
 * @param {Function} cb callback function
 * @returns {void}
 */
async function storeChat(
  data,
  touuid,
  iduser1,
  cb = (err, data) => null,
) {
  const pool_ = await _db.pool.connect().catch((e) => {
    console.trace(e);
  });
  try {
    const [ iduser2] = await _getUserIDs([ touuid], pool_);

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
    cb(null, { idchat, idchat_text, touuid });
  } catch (error) {
    cb(error);
    if (pool_.release) pool_.release();
  }
}

/**
 *
 * @param {{ content:string, sender:number, idroom:number }} param0
 * @param {Function} cb
 */
async function storeRoomChat(
  { content, sender, idroom },
  cb = (err, data) => null,
) {
  const pool_ = await _db.pool.connect().catch((e) => {
    console.trace(e);
  });
  try {
    /**
     * @type {typeDef.ChatText}
     */
    const message_ = { content, idroom, sender };
    const result2 = await pool_.query(
      `insert into room_text (${Object.keys(message_).join(', ')}) \
      values ($1, $2, $3) RETURNING idroom_text;`,
      Object.values(message_),
    );
    const {
      rows: [{ idroom_text }],
    } = result2;
    cb(null, { idroom_text });
  } catch (error) {
    cb(error);
    // if (pool_.release) pool_.release();
  } finally {
    pool_.release();
  }
}
module.exports = {storeChat,storeRoomChat, storeWSdata };
