const express = require('express');
const admin = require('firebase-admin');

const firestoreService = require('../services/firestore-service');
const helpers = require('../helpers');

// Reference:
// https://firebase.google.com/docs/auth/admin/manage-cookies
// https://firebase.google.com/docs/auth/admin/verify-id-tokens

const router = express.Router();

router.get('/userInfo', async (req, res) => {
  try {
    const firebaseToken = helpers.getTokenFromCookies(req);
    const decodedClaims = await admin.auth().verifySessionCookie(firebaseToken, true);
    if (decodedClaims?.exp <= Date.now() / 1000) {
      res.clearCookie('__session');
      res.send({ status: 'Unauthorized', message: 'User is not logged-in' });
    }
    const userPermission = await firestoreService.queryUserPermission(decodedClaims?.uid);

    res.send(userPermission);
  } catch (error) {
    res.clearCookie('__session');
    res.send({ status: 'Unauthorized', message: 'User is not logged-in' });
  }
});

router.post('/verifyIdToken', async (req, res) => {
  const googleIdToken = req.body.googleIdToken; // googleIdToken
  const token = req.body.token; // idToken

  try {
    const decodedIdToken = await admin.auth().verifyIdToken(String(token));
    const userPermission = await firestoreService.queryUserPermission(decodedIdToken.uid);
    // Only process if the authorised user just signed-in in the last 5 minutes.
    if (userPermission && new Date().getTime() / 1000 - decodedIdToken.auth_time < 5 * 60) {
      // Set idToken as cookies
      await _setCookies(res, token, googleIdToken);
      res.send(userPermission);
    } else {
      console.log(`User ${decodedIdToken.email} doesn't have permission`);
      await admin.auth().revokeRefreshTokens(decodedIdToken.uid);
      res
        .status(403)
        .send({ status: 'Unauthorized', message: `User ${decodedIdToken.email} doesn't have login permission` });
    }
  } catch (error) {
    console.error('Error while getting Firebase User record:', error);
    res.status(403).send({ status: 'Unauthorized', message: 'Error while user login' });
  }
});

router.post('/logout', async (req, res) => {
  const firebaseToken = helpers.getTokenFromCookies(req);
  res.clearCookie('__session');
  try {
    const decodedClaims = await admin.auth().verifySessionCookie(firebaseToken);
    admin
      .auth()
      .revokeRefreshTokens(decodedClaims?.sub)
      .then(() => res.sendStatus(200));
  } catch (error) {
    res.sendStatus(500);
  }
});

const _setCookies = async (res, token, googleIdToken) => {
  const expiresIn = 60 * 60 * 24 * 7 * 1000; // 7 days
  const sessionCookie = await admin.auth().createSessionCookie(String(token), { expiresIn });
  const options = { maxAge: expiresIn, httpOnly: true, secure: process.env.NODE_ENV === 'production' };
  // It must be "__session" or Google Cloud Functions would not retain it.
  // https://stackoverflow.com/questions/59489994/unable-to-read-cookies-from-the-get-header-in-node-js-express-on-firebase-cloud
  // __session cookies contains 2 tokens: firebase id token#google id token
  res.cookie('__session', `${sessionCookie}#${googleIdToken}`, options);
  res.setHeader('Cache-Control', 'private');
};

module.exports = router;
