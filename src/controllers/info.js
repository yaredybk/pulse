const express = require('express');
const { _db, _upsertUser } = require('../../utils/db');
const { _rdAuth } = require('../../utils/auth0');
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
/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns
 */
exports.user = async (req, res) => {
  const { uuid } = req.params;
  if (!uuid) res.sendStatus(400);
  _db
    .query(`select uuid, name, profile, email from users where uuid = $1`, [
      uuid,
    ])
    .then(({ rows: [user] }) => {
      if (!user) return res.sendStatus(404);
      return res.send(user);
    })
    .catch((e) => {
      console.warn(e);
      res.sendStatus(500);
    });
};
/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns
 */
exports.me = async (req, res) => {
  const { callback } = req.query;
  if (!req.oidc.user) return res.sendStatus(401);
  let { name, picture: profile, email, ...info } = req.oidc.user || {};

  if (callback == 'login') {
    const { err, data } = await _upsertUser({
      name,
      // uname: name.replaceAll(' ', '_'), // // let users pick uname after signup
      email,
      profile,
      info,
    }).catch(console.trace);
    if (err) {
      console.warn(err);
      res.sendStatus(500);
    } else {
      req.session.uuid = data.uuid;
      req.session.save((err) => {
        if (err) console.warn(err);
      });
      res.send({
        user: {
          name: data.name,
          profile: data.profile,
          email: data.email,
          uname: data.uname,
          uuid: data.uuid,
        },
      });
    }
  } else {
    const { err, data } = await _upsertUser({
      name,
      // uname: name.replaceAll(' ', '_'), // // let users pick uname after signup
      email,
      profile,
      info,
    });
    if (err) {
      console.log(err);
      res.sendStatus(500);
    } else {
      req.session.uuid = data.uuid;
      console.warn('saving uuid');
      console.log(data.uuid);
      
      req.session.save((err) => {
        if (err) console.warn(err);
      });
      res.send({ user: { ...req.oidc.user, ...data } });
    }
  }
};
