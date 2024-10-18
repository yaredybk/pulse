const express = require('express');
const { _db, _upsertUser, _checkUser, _updateUser } = require('../../utils/db');
const { _rdAuth } = require('../../utils/auth0');
const { _uploadImage } = require('../../utils/api_imgbb');

/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns
 */
exports.user = async (req, res) => {
  const { uuid } = req.params;
  if (!uuid || uuid.length != 36) return res.sendStatus(400);
  _db
    .query(`select uuid, name, profile, email from users where uuid = $1`, [
      uuid,
    ])
    .then(({ err, rows }) => {
      if (err) res.sendStatus(404);
      else res.send(rows[0]);
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
  let data_ = { name, picture: profile, email, ...info };
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
      return res.sendStatus(500);
    } else {
      req.session.uuid = data.uuid;
      req.session.save((err) => {
        if (err) console.warn(err);
      });
      data_ = { ...data, ...data_ };
    }
  } else {
    let { err, data } = await _checkUser({
      name,
      // uname: name.replaceAll(' ', '_'), // // let users pick uname after signup
      email,
      profile,
      info,
    });
    if (err) {
      console.log(err);
      const { err: e2, data: d2 } = await _upsertUser({
        name,
        // uname: name.replaceAll(' ', '_'), // // let users pick uname after signup
        email,
        profile,
        info,
      });
      if (e2) return res.sendStatus(500);
      else {
        data = d2;
        req.session.uuid = data.uuid;
        req.session.save((err) => {
          if (err) console.warn(err);
        });
      }
    } else {
      req.session.uuid = data.uuid;
      req.session.save((err) => {
        if (err) console.warn(err);
      });
      data_ = { ...data, ...data_ };
    }
  }
  (() => {
    let { active, bio, city, country, email, gender, name, profile, uuid } =
      data_;
    res.send({
      user: {
        active,
        bio,
        city,
        country,
        email,
        gender,
        name,
        profile,
        uuid,
      },
    });
  })();
};
/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns
 */
exports.editMe = async (req, res) => {
  const { callback } = req.query;
  const keys = [
    'name',
    'uname',
    'bio',
    'city',
    'country',
    'gender',
    'name',
    'uname',
  ];
  const uuid = req.session.uuid;
  let data_ = { uuid };
  keys.forEach((k) => {
    const val = req.body[k];
    if (val) data_[k] = val;
  });
  if (req.files) {
    
    // if (!req.files) return res.status(400).send('No files were uploaded.');
    const uploadedFile = req.files.image;
    console.log(uploadedFile);
    const {
      err,
      data: { display_url, ...data },
    } = await _uploadImage(uploadedFile);
    if (err) return res.sendStatus(500);
    const pool_ = await _db.pool.connect();
    try {
      const {
        rows: [{ profile, info }],
      } = await pool_.query(`select profile, info from users where uuid = $1`, [
        uuid,
      ]);
      await pool_.query(
        `update users set profile = $1, info = $2 where uuid = $3`,
        [display_url, { ...info, ...data }, uuid],
      );
      await pool_.query(
        `insert into profiles (uuid,delete_url,display_url,thumb_url,type) \
        values ($1,$2,$3,$4, 'user') ;`,
        [uuid, info.delete_url, profile, info.thumb_url],
      );
      return res.send({ user: { profile: display_url } });
    } catch (err) {
      console.warn(err);
      return res.sendStatus(500);
    } finally {
      pool_.release();
    }
  }
  if (data_.gender && data_.gender.length > 1) return res.sendStatus(400);
  const { err, data } = await _updateUser(data_).catch(console.trace);
  if (err) {
    console.warn(err);
    return res.sendStatus(500);
  }
  req.session.save((err) => err && console.warn(err));
  data_ = { ...data, ...data_ };

  res.send({
    user: data,
  });
};
