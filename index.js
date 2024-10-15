require('dotenv').config();
const path = require('path');
const express = require('express');
const { auth, requiresAuth } = require('express-openid-connect');
const helmet = require('helmet');
const { _rdAuth } = require('./utils/auth0.js');
const jwt = require('jsonwebtoken');
const { _db, _upsertUser } = require('./utils/db.js');
const { _session } = require('./utils/session.js');
const { newWebSocket } = require('./utils/webSocket.js');
const { _rdCli } = require('./utils/redis.js');

const app = express();
app.set('env', process.env.NODE_ENV || 'production');

// helmet.contentSecurityPolicy({
//   useDefaults: true,
//   directives: {
//     'img-src': [
//       "'self'",
//       'https://s.gravatar.com',
//       'https://i1.wp.com/cdn.auth0.com',
//       'https://lh3.googleusercontent.com',
//     ],
//   },
// });
app.use(helmet());
// STATIC ASSETS OTHER THAN /a
app.use(express.static('pages'));
app.use(_session);
app.use((r, rs, n) => {
  console.log('M', r.session.id, r.session.uuid);
  n();
});
// app.use(
//   session({
//     store: _rdSess,
//     resave: false, // required: force lightweight session keep alive (touch)
//     saveUninitialized: true, // Create session for new users
//     secret: process.env.SESSION_KEY,
//     cookie: {
//       httpOnly: process.env.NODE_ENV == 'production',
//       path: '/',
//       secure: process.env.NODE_ENV == 'production',
//       sameSite: true,
//       maxAge: 1000 * 60 * 10, // 10 minutes session timeout in milliseconds
//       rolling: true, // Reset cookie expiry on every request
//     },
//     name: 'anon',
//   }),
// );
// helmet.contentSecurityPolicy
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      'img-src': [
        "'self'",
        'https://lh3.googleusercontent.com',
        'https://s.gravatar.com',
        'https://i1.wp.com/cdn.auth0.com',
      ],
    },
  }),
);
/** SIMPLE LOGING */
// const logredis = require('connect-redis').default;
// const _rdLog = new logredis({ client: _rdCli, prefix: 'log' });
app.use((r, rs, n) => {
  console.warn(r.url);
//   _rdLog.all((e, d) => {
//     console.log(e);
//     console.log(d);
//   });
//   _rdLog.clear();
//   _rdLog.set(new Date().toLocaleTimeString(), r.url, (e, d) => {
//     if (e) console.warn(e);
//   });
  n();
});

/** AUTH0 */
app.use(
  auth({
    session: {
      store: _rdAuth,
      // rollingDuration: 3 * 24 * 3600,
    },
    clientAssertionSigningAlg: 'RS256',
    afterCallback: async (req, _, session) => {
      try {
        const decoded = jwt.decode(session.id_token, process.env.AUTH0_SECRET, {
          algorithms: ['HS256'],
        });
        const { name, picture: profile, email, updated_at, ...info } = decoded;
        const { err, data } = await _upsertUser({
          name,
          email,
          profile,
          updated_at,
          info,
        });
        if (err) {
          console.warn(err);
        } else {
          req.session.uuid = data.uuid;
          req.session.save((err) => {
            if (err) console.warn(err);
          });
        }
        return session;
      } catch (error) {
        console.warn(error);
        return session;
      }
      // console.log(session);
      // console.log(session.id_token);
    },
    authRequired: false,
    auth0Logout: true,
    secret: process.env.AUTH0_SECRET,
    baseURL: process.env.AUTH0_AUDIENCE,
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
    routes: {
      login: false,
      callback: false,
      logout: false,
    },
  }),
);
app.get('/api/login', (req, res) => {
  const origin =
    process.env.NODE_ENV == 'development'
      ? new URL(req.headers.referer || req.headers.host).origin
      : process.env.AUTH0_AUDIENCE;
  return res.oidc.login({
    returnTo: origin + '/a/me?callback=login',
    authorizationParams: {
      redirect_uri: origin + '/api/profile/callback',
    },
  });
});
app.get('/api/logout', (req, res) => {
  const origin =
    process.env.NODE_ENV == 'development'
      ? new URL(req.headers.referer || req.headers.host).origin
      : process.env.AUTH0_AUDIENCE;
  return res.oidc.logout({
    returnTo: origin,
    authorizationParams: {
      redirect_uri: origin + '/a/me?callback=logout',
    },
  });
});
app.get('/api/profile/callback', async (req, res) => {
  const origin =
    process.env.NODE_ENV == 'development'
      ? new URL(req.headers.referer || req.headers.host).origin
      : process.env.AUTH0_AUDIENCE;
  return res.oidc.callback({
    redirectUri: origin + '/api/profile/callback',
  });
});
app.post(
  '/api/profile/callback',
  express.urlencoded({ extended: false }),
  async (req, res) => {
    // console.log(req.headers.referer, req.headers.host);
    const origin =
      process.env.NODE_ENV == 'development'
        ? new URL(req.headers.referer || req.headers.host).origin
        : process.env.AUTH0_AUDIENCE;
    return res.oidc.callback({
      redirectUri: origin + '/api/profile/callback',
    });
  },
);

app.get('/api/protected', (rq, rs) => {
  rs.send({ status: 'you are authenticated!', user: rq.oidc.user });
});
// STATIC ASSETS OF THE APP
app.use('/a', express.static('a', { fallthrough: true }));
app.get('/a/*', (_, res) => {
  res.sendFile(path.join(__dirname, './a/index.html'));
});
app.use(express.json());
app.use('/api/list', requiresAuth(), require('./src/routes/list_routs.js'));
app.use('/api', require('./src/routes/api_routes.js'));

// START
setTimeout(() => {
  // START HTTP SERVER
  const server = app.listen(process.env.PORT || 5000, () => {
    console.log(`-http- listening @:${process.env.PORT || 5000}`);
  });
  // START WS SERVER
  newWebSocket(server);
}, 0);
