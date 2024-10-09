const express = require('express');

/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns
 */
exports.me = async (req, res) => {
  res.send({ user: req.oidc.user });
};
