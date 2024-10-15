require('dotenv').config();
const { _rdCli } = require('./redis');
const RedisStore = require('connect-redis').default;

// Initialize client.
const rdAuth = new RedisStore({
  client: _rdCli,
  prefix: 'auth0:',
});
// rdAuth.ids((e,d)=>{
//   console.log(d);
  
// })
module.exports = { _rdAuth: rdAuth };
