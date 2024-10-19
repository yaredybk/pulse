const ws_open = require('ws').OPEN;
const ws_ = require('ws').Server;
const { _updateUser } = require('./db');
const { _session } = require('./session');
const {
  // storeWSdata,
  storeChat,
  storeRoomChat,
} = require('./storeWebSocketdata');
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
          ws.uuid = request.session.uuid;
          ws.iduser = request.session.iduser;
          wss.emit('connection', ws, request);
        });
      },
    );
  });
  async function onConnection(senderWS, rq) {
    function onIdle() {
      if (time_) {
        clearTimeout(time_);
      }
      time_ = setTimeout(() => {
        senderWS.send('timeout');
        senderWS.close();
        _updateUser({ uuid: senderWS.uuid, active: 0 });
      }, timeOut_ms);
    }
    function onMessage(message) {
      onIdle();
      message = message.toString();
      let data = message;
      let path, root, type, category, to_;
      if (message.startsWith('{') || message.startsWith('[')) {
        try {
          d = JSON.parse(message);
          path = d.path;
          data = d.data;
          [root, type, category, to_] = path.replace(/^\//, '').split('/');
          path = [root, type, category, to_, senderWS.uuid].join('/');
          let tmp_cl;
          function cb(err, results) {
            if (err) return console.warn(err);
            const payLoad = {
              path: `message/${type}/${category}/${to_}/${senderWS.uuid}`,
              data: { ...results, fromuuid: senderWS.uuid, touuid: to_ },
            };
            let tmp = JSON.stringify(payLoad);
            try {
              // only send conformation for sent messages
              // or message info if this is first chat for this client
              // senderWS.send(tmp);
              tmp_cl && tmp_cl.send(tmp);
            } catch (error) {
              console.warn('unable to send back!\n', error);
            }
          }
          const tmp_ = JSON.stringify({ path, data });
          switch (type) {
            case 'chat':
              if (to_)
                wss.clients.forEach((c) => {
                  if (
                    c.readyState === ws_open &&
                    to_ == c.uuid &&
                    c != senderWS
                  ) {
                    tmp_cl = c;
                    c.send(tmp_);
                  }
                });
              storeChat(data, to_, senderWS.iduser, cb);
            case 'room':
              wss.clients.forEach((c) => {
                if (
                  c.readyState === ws_open &&
                  c != senderWS &&
                  c.rooms.some(to_)
                ) {
                  tmp_cl = c;
                  c.send(tmp_);
                }
              });
              storeRoomChat(
                { content: data, idroom: to_, sender: senderWS.iduser },
                callBackRoom,
              );
              break;

            default:
              console.warn('UNHANDLED storeWSdata', type);
              break;
          }

          // storeWSdata(data, root, type, category, to_, senderWS.uuid, cb);
        } catch (error) {
          console.warn('parse error');
          data = message;
        }
      }
      // else {
      //   console.warn('NON_JSON M\n', message);
      // }
    }
    if (!senderWS.uuid) {
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
    _updateUser({ uuid: senderWS.uuid, active: 1 });
    let time_ = 0;
    onIdle();
    senderWS.on('message', onMessage);
    senderWS.on('close', () => {
      clearTimeout(time_);
      _updateUser({ uuid: senderWS.uuid, active: 0 });
    });
  }
  wss.on('connection', onConnection);
  wss.on('error', (error) => {
    console.warn('wss error\n', error);
  });
  wss.on('close', () => _updateUser({ uuid: senderWS.uuid, active: 0 }));
}

module.exports.newWebSocket = newWebSocket;
