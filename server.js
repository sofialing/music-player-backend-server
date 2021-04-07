require('dotenv').config();
const express = require('express');
const request = require('request');
const querystring = require('querystring');
const app = express();

const redirect_uri = process.env.REDIRECT_URI || 'http://localhost:8888/callback';
const scopes = [
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-library-read',
  'user-follow-modify',
  'user-follow-read',
  'user-read-private',
  'user-read-currently-playing',
  'user-read-recently-played',
  'user-read-playback-state',
  'user-top-read',
  'user-modify-playback-state',
  'user-read-email',
  'streaming',
];

app.get('/login', (req, res) => {
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: process.env.CLIENT_ID,
      scope: scopes.join('%20'),
      redirect_uri
    }));
});

app.get('/callback', (req, res) => {
  const code = req.query.code || null;
  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + (new Buffer.from(
        process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET
      ).toString('base64'))
    },
    json: true
  };

  request.post(authOptions, (error, response, body) => {
    const access_token = body.access_token;
    const refresh_token = body.refresh_token;
    const expires_in = body.expires_in;
    const uri = process.env.FRONTEND_URI || 'http://localhost:3000';
    // res.redirect(uri + '?access_token=' + access_token + '&refresh_token=' + refresh_token);
    res.redirect(`${uri}?access_token=${access_token}&refresh_token=${refresh_token}&expires_in=${expires_in}`);
  });
});

app.get('/refresh_token', (req, res) => {
  const refresh_token = req.query.refresh_token;
  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      grant_type: 'refresh_token',
      refresh_token
    },
    headers: {
      'Authorization': 'Basic ' + (new Buffer.from(
        process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET
      ).toString('base64'))
    },
    json: true
  };

  request.post(authOptions, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const access_token = body.access_token;
      const uri = process.env.FRONTEND_URI || 'http://localhost:3000';
      res.redirect(uri + '?access_token=' + access_token);
    }
  });
});

const port = process.env.PORT || 8888;
console.log(`Listening on port ${port}. Go /login to initiate authentication flow.`);

app.listen(port);
