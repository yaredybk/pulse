const express = require('express');
const {
  _db,
  _upsertUser,
  _checkUser,
  _updateUser,
  _updateRoom,
} = require('../../utils/db');
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
    .query(`select name,email,bio,country,uuid,profile,active from users where uuid = $1`, [
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
      req.session.id = data.id;
      req.session.iduser = data.iduser;
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
      res.sendStatus(401);
    } else {
      req.session.id = data.id;
      req.session.iduser = data.iduser;
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
    const uploadedFile = req.files.image;
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
/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns
 */
exports.newwRoom = async (req, res) => {
  const iduser = req.session.iduser;
  const uuid = req.session.uuid;
  const { name, bio } = req.body;
  if (!name) return res.sendStatus(400);

  const {
    err,
    rows: [room],
  } = await _db.query(
    `insert into rooms (name, bio, admin) \
    values ($1,$2,$3) RETURNING idroom;`,
    [name, bio, iduser],
  );
  if (err) {
    console.warn(err);
    return res.sendStatus(500);
  }
  if (room && room.idroom)
    return res.send({
      room: { name, bio, ...room },
    });
  return res.sendStatus(500);
};
/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns
 */
exports.room = async (req, res) => {
  const iduser = req.session.iduser;
  // const uuid = req.session.uuid;
  const { idroom } = req.params;
  const {
    err,
    rows: [room],
  } = await _db.query(
    `select rooms.name as name,rooms.bio,u."name" as admin_name,rooms.uuid,rooms.idroom, \
    rooms.profile, rooms.active, u.email,  u.uuid as admin_uuid,\
     u.profile as uprofile from rooms join users u on admin = iduser \
    where idroom = $1 ;`,
    [idroom],
  );
  if (err) {
    console.warn(err);
    return res.sendStatus(500);
  }
  if (room) return res.send({ room });
  return res.sendStatus(404);
};
/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns
 */
exports.addRoomMembers = async (req, res) => {
  const iduser = req.session.iduser;
  const { idroom } = req.params;
  const { newMembers } = req.body;
  if (!Array.isArray(newMembers)) return res.sendStatus(400);
  const { err1, rows: rows1 } = await _db.query(
    `select * from rooms where admin = $1 and idroom = $2`,
    [iduser, idroom],
  );
  if (err1 || !rows1 || !rows1[0]) return res.sendStatus(500);
  const qq = `insert into members (idroom, iduser) values \
  ${Array.from(Array(newMembers.length))
    .map((_, i) => `($1 , $${i + 2})`)
    .join(',')}; `;
  const {
    err,
    rows: [room],
  } = await _db.query(qq, [idroom, ...newMembers]);
  if (err) {
    console.warn(err);
    return res.sendStatus(500);
  }
  res.send({ newMembers });
};
/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns
 */
exports.roomMembers = async (req, res) => {
  const iduser = req.session.iduser;
  const { idroom } = req.params;
  const { newMembers } = req.body;
  if (!Array.isArray(newMembers)) return res.sendStatus(400);
  const { err1, rows } = await _db.query(
    `select * from members left join users on members.iduser = user.iduser\
     where idroom = $1`,
    [idroom],
  );
  if (err1 || !rows || !rows[0]) return res.sendStatus(500);
  return res.send(rows);
};

/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns
 */
exports.editRoom = async (req, res) => {
  const keys = ['name', 'bio'];
  const iduser = req.session.iduser;
  const { idroom } = req.params;
  let data_ = { idroom };
  keys.forEach((k) => {
    const val = req.body[k];
    if (val) data_[k] = val;
  });
  if (req.files) {
    const uploadedFile = req.files.image;
    const {
      err,
      data: { display_url, ...data },
    } = await _uploadImage(uploadedFile);
    if (err) return res.sendStatus(500);
    const pool_ = await _db.pool.connect();
    try {
      const {
        rows: [{ profile, uuid, info }],
      } = await pool_.query(
        `select profile,uuid, info from rooms where idroom = $1`,
        [idroom],
      );
      await pool_.query(
        `update rooms set profile = $1, info = $2 where idroom = $3`,
        [display_url, { ...info, ...data }, idroom],
      );
      if (profile)
      await pool_.query(
        `insert into profiles (uuid,delete_url,display_url,thumb_url,type) \
        values ($1,$2,$3,$4, 'room') ;`,
        [uuid, info.delete_url, profile, info.thumb_url],
      );
      return res.send({ room: { profile: display_url } });
    } catch (err) {
      console.warn(err);
      return res.sendStatus(500);
    } finally {
      pool_.release();
    }
  }
  // return res.status(404).send('API not ready');
  const { err, data } = await _updateRoom(data_).catch(console.trace);
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

// async function tmpFunc (req,res,query)
