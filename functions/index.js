const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const env = require('dotenv').config().parsed;
const express = require('express');
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const helmet = require('helmet');
const throttle = require('express-throttle-bandwidth');

const authRoute = require('./route/auth-route');
const albumRoute = require('./route/album-route');
const albumTagsRoute = require('./route/album-tag-route');
const photoRoute = require('./route/photo-route');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
const corsHeader = (req, res, next) => {
  console.log('Request API:', req.url);
  const allowedOrigins = ['http://localhost:9000', env.ALBUM_URL];
  const origin = req.headers.origin;
  if (allowedOrigins.indexOf(origin) > -1) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if ('OPTIONS' === req.method) {
    res.sendStatus(200);
  } else {
    next();
  }
};
app.use(corsHeader);
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(helmet());
app.use(throttle(1024 * 128)); // throttling bandwidth

// Route
app.use('/api/auth', authRoute);
app.use('/api/albums', albumRoute);
app.use('/api/albumTags', albumTagsRoute);
app.use('/api/photos', photoRoute);

exports.main = functions.https.onRequest(app);
