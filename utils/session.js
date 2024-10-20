const session = require('express-session');
require('dotenv').config();
const { _rdCli } = require('./redis');
const { _upsertUser } = require('./db');
const RedisStore = require('connect-redis').default;

// Initialize store.
let rdSess = new RedisStore({
  client: _rdCli,
  prefix: 'myapp:',
});
// rdSess.ids((e, d) => {
//   console.log(d);
// });
const ses = session({
  store: rdSess,
  resave: true, // required: force lightweight session keep alive (touch)
  saveUninitialized: true, // Create session for new users
  secret: process.env.SESSION_KEY,
  cookie: {
    httpOnly: true,
    path: '/',
    // secure: process.env.NODE_ENV == 'production',
    secure: false,
    // sameSite: process.env.NODE_ENV == 'production',
    sameSite: false,
    maxAge: 1000 * 60 * 10, // 10 minutes session timeout in milliseconds
    rolling: true, // Reset cookie expiry on every request
  },
  name: 'anon',
});

/**
 * @param {Request} req the requist object
 * @param {{iduser: number,uuid: string,name: string,gender: string,birth: string,country: string,city: string,phone: string,email: string,uname: string,idpass: number,bio: string,profile: string,active:number,created_at : string,updated_at : string,info:object}} user
 * @returns {Promise<{err, data:{iduser: number,uuid: string,name: string,gender: string,birth: string,country: string,city: string,phone: string,email: string,uname: string,idpass: number,bio: string,profile: string,active:number,created_at : string,updated_at : string,info:object}}>}
 */
async function _upgradeSession(req, user) {
  const { err, data, rooms } = await _upsertUser(user, true);
  if (err) {
    return { err };
  } else {
    req.session.uuid = data.uuid;
    req.session.iduser = data.iduser;
    req.session.rooms = rooms;
    req.session.save((err) => {
      if (err) return { err };
      return { err: null, data };
    });
    return;
  }
}

module.exports = { _rdSess: rdSess, _session: ses, _upgradeSession };
