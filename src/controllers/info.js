const express = require('express');
const { _db } = require('../../utils/db');
const { _rdAuth } = require('../../utils/redis');

function loadUUID(user, req, res) {
  _db
    .query('select uname,uuid from users where email = $1;', [user.email])
    .then((r) => {
      const {
        rows: [{ uname, uuid }],
      } = r;
      const sess = req.headers.cookie.match(/appSession=([^;]*);/);
      if (sess)
        _rdAuth.get(sess[1], (err, ses) => {
          if (err) console.trace(err);
          else {
            ses.uuid = uuid;
            _rdAuth.set(sess, ses);
          }
        });
      else {
        console.warn('session not found');
      }
      res.send({
        user: { ...user, uname, uuid },
      });
    })
    .catch((e) => {
      console.trace(e);
      res.sendStatus(500);
    });
}

/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns
 */
exports.me = async (req, res) => {
  const { callback } = req.query;
  if (!req.oidc.user) return res.sendStatus(401);
  const { name, picture, email, sub } = req.oidc.user || {};
  
  // {
  //   sid: 'DgzKxUAn9pmbcU5Ucdy00xwMo-b8kxFL',
  //   given_name: 'Yared',
  //   family_name: 'Bekuru',
  //   nickname: 'yb12ybk',
  //   name: 'Yared Bekuru',
  //   picture: 'https://lh3.googleusercontent.com/a/ACg8ocKx4VPyo_5Ubwps9eE10j2_WYi6pVfVF-3dUTboYfxQXpa0QND6=s96-c',
  //   updated_at: '2024-10-10T20:23:48.468Z',
  //   email: 'yb12ybk@gmail.com',
  //   email_verified: true,
  //   sub: 'google-oauth2|107373298007112761050'
  // }

  if (callback == 'login') {
    _db
      .query(
        'insert into users (name,uname,email,profile) values ($1, $2, $3, $4);',
        [name, name.replaceAll(' ', '_'), email, picture]
      )
      .then(() => {
        loadUUID({ name, picture, email, sub }, req, res);
      })
      .catch((e) => {
        if (e.code == '23505') {
          loadUUID({ name, picture, email, sub }, req, res);
        } else res.sendStatus(500);
      });
  } else {
    res.send({ user: req.oidc.user });
  }
};
