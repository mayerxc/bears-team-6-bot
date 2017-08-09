const passport = require('passport');
const SpotifyStrategy = require('passport-spotify').Strategy;
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const axios = require('axios');

require('dotenv').load();

var app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

passport.use(new SpotifyStrategy({
    clientID: process.env.SPOTIFY_ID,
    clientSecret: process.env.SPOTIFY_SECRET,
    callbackURL: 'https://fb259514.ngrok.io/auth/spotify/callback'   
}, function(accessToken, refreshToken, profile, done) {
    var user = {};
    user.spotify = {};
    user.spotify.id = profile.id;
    user.spotify.token = accessToken;
    return done(null, user);
}));

app.use(session({secret: 'asfhhgd'}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {    
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

app.get('/', function(req, res) {
    res.send('<h1>Hello World</h1><br/><a href="/auth/spotify">Spotify Test</a>');
});

app.get('/success', function(req,res){
    console.log(req.user);
    axios({
        method: 'get',
        url: 'https://api.spotify.com/v1/me/player/recently-played',
        headers: {Authorization: 'Bearer ' + req.user.spotify.token}
    }).then(function(response){ 
        var data = [];
        response.data.items.map(function(item){
            data.push({
                artist: item.track.artists[0].name,
                album: item.track.album.name,
                song: item.track.name
            });
        });
        console.log('the token is', req.user.spotify.token);
        res.json(data); });
});

app.get('/auth/spotify',
  passport.authenticate('spotify', {scope: ['user-read-email', 'user-read-private', 'user-read-recently-played'], showDialog: true}), // add scopes here for web api access
  function(req, res){
    // The request will be redirected to spotify for authentication, so this
    // function will not be called.
  });

app.get('/auth/spotify/callback',
  passport.authenticate('spotify', { failureRedirect: '/' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/success');
  });

app.post('/testing123', (req, res) => {
    //const url = `https://accounts.spotify.com/authorize?client_id=${process.env.SPOTIFY_ID}&redirect_uri=https://fb259514.ngrok.io/testing123/callback&scope=user-read-private%20user-read-email&response_type=token`;
    const url = 'https://fb259514.ngrok.io/auth/spotify';
    const responseObj = {
        'text': 'Click the link below to login',
        'response_type': 'in_channel',
        'attachments': [{
            'title': 'Login',
            'title_link': url
        }]    
    }
    return res.send(responseObj);
});

app.get('/testing123/callback', (req, res) => {
    console.log('success!');
    console.log('callback url req.params is', req.params);
    console.log('callback url req.query is', req.query);
    res.send('You are now logged in!');
});


app.listen(3000, function() {
    console.log('now listening on port 3000');
});



