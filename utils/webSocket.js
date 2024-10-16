const ws_open = require('ws').OPEN;
const ws_ = require('ws').Server;
const { _updateUser } = require('./db');
const { _session } = require('./session');
const { storeWSdata } = require('./storeWebSocketdata');
// const { wss } = require('..');
const maxClients = process.env.WS_LIMIT || 50;
const timeOut_ms = process.env.WS_TIMEOUT || 5 * 60 * 1000;

function newWebSocket(server) {
  const wss = new ws_({ noServer: true });
  server.on('upgrade', async (request, socket, head) => {
    function onSocketError(err) {
      console.error('onSocketError\n', err);
      socket.destroy();
    }
    socket.on('error', onSocketError);
    let upgraded = false;
    await _session(
      request,
      () => null,
      async () => {
        if (upgraded) {
          return console.warn('upgrad 2');
        }
        if (!request.session?.uuid) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }
        socket.removeListener('error', onSocketError);
        upgraded = true;
        await wss.handleUpgrade(request, socket, head, function done(ws) {
          wss.emit('connection', ws, request, request.session.uuid);
        });
      },
    );
  });
  async function onConnection(senderWS, rq, fromuuid) {
    function onIdle() {
      if (time_) {
        clearTimeout(time_);
      }
      time_ = setTimeout(() => {
        senderWS.send('timeout');
        senderWS.close();
        // console.warn('- ws - TimeOUT!', wss.clients.size);
      }, timeOut_ms);
    }
    senderWS.uuid = fromuuid;
    function onMessage(message) {
      onIdle();
      message = message.toString();
      let data = message;
      let path, root, type, category, touuid;
      if (message.startsWith('{') || message.startsWith('[')) {
        try {
          d = JSON.parse(message);
          path = d.path;
          data = d.data;
          [root, type, category, touuid] = path.replace(/^\//, '').split('/');
          path = [root, type, category, touuid, fromuuid].join('/');
          let tmp_cl;
          function cb(err, results) {
            if (err) return console.warn(err);
            const payLoad = {
              path: `message/${type}/${category}/${touuid}/${fromuuid}`,
              data: results,
            };
            let tmp = JSON.stringify(payLoad);
            try {
              senderWS.send(tmp);
              tmp_cl && tmp_cl.send(tmp);
            } catch (error) {
              console.warn('unable to send back!\n', error);
            }
          }
          if (touuid)
            wss.clients.forEach((c) => {
              if (
                c.readyState === ws_open &&
                touuid == c.uuid &&
                c != senderWS
              ) {
                const tmp_ = JSON.stringify({ path, data });
                tmp_cl = c;
                c.send(tmp_);
              }
            });
          storeWSdata(data, root, type, category, touuid, fromuuid, cb);
        } catch (error) {
          console.warn('parse error');
          data = message;
        }
      }
      // else {
      //   console.warn('NON_JSON M\n', message);
      // }
    }
    if (!fromuuid) {
      // console.warn('senderWS not authorized');
      senderWS.send('NOT Authorized!');
      senderWS.close();
      return;
    }
    if (wss.clients.size > maxClients) {
      console.warn('senderWS maxed out:', wss.clients.size);
      senderWS.send('Server is overloaded. Please try again later!');
      senderWS.close();
      return;
    }
    senderWS.send('welcome');
    _updateUser({ uuid:fromuuid, active: 1 });
    let time_ = 0;
    onIdle();
    senderWS.on('message', onMessage);
    senderWS.on('close', () => {
      clearTimeout(time_);
      // console.warn('-X:', fromuuid.slice(0, 4), wss.clients.size);
    });
  }
  wss.on('connection', onConnection);
  wss.on('error', (error) => {
    console.warn('wss error\n', error);
  });
  wss.on('close', () => {
    console.warn('- wss - CLOSED!');
  });
}

module.exports.newWebSocket = newWebSocket;
