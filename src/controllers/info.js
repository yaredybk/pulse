const express = require('express');
const eoc = require('express-openid-connect');
const { _db } = require('../../utils/db');

/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns
 */
exports.me = async (req, res) => {
  const { callback } = req.query;
  if (!req.oidc.user) return res.sendStatus(400);
  const { name, picture, email, sub } = req.oidc.user || {};
  console.log(req.oidc.user);
  console.log(callback);
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
      .then((r) => {
        console.log(r);
        res.send({ user: { name, picture, email, sub } });
      })
      .catch((e) => {
        console.trace(e);
        console.trace(e.code);
        if (e.code == '23505') {
          console.warn(e.code + '23505');
          _db
            .query('select uname from users where email = $1;', [email])
            .then((r) => {
              console.log(r);

              const {
                rows: [{ uname }],
              } = r;
              console.log({ uname });
              res.send({ user: { name, picture, email, sub, uname } });
            })
            .catch((e) => {
              console.trace(e);
              res.sendStatus(500);
            });
        } else res.sendStatus(500);
      });
  } else {
    res.send({ user: req.oidc.user });
  }
};
