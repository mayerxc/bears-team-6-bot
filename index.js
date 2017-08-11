const passport = require('passport');
const SpotifyStrategy = require('passport-spotify').Strategy;
const express = require('express');
const session = require('express-session');
const axios = require('axios');

require('dotenv').load();

var app = express();

passport.use( new SpotifyStrategy( {
    clientID: process.env.SpotifyId,
    clientSecret: process.env.SpotifySecret,
    callbackURL: "http://localhost:3000/auth/spotify/callback"    
    }, 
    function(accessToken, refreshToken, profile, done) {
        var user = {};
        user.spotify = {};
        user.spotify.id = profile.id;
        user.spotify.token = accessToken;
        return done(null, user);
    }
) );

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
    res.send('<h1>Hello World!!!!!!</h1><br/><a href="/auth/spotify">Spotify Test</a>');
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

        res.json(data); });    
});

app.get('/auth/spotify',
  passport.authenticate('spotify', 
    // add scopes here for web api access
    {scope: ['user-read-email', 'user-read-private', 'user-read-recently-played'], showDialog: true}
    ), 
    function (req, res) {
    // The request will be redirected to spotify for authentication, so this
    // function will not be called.
  });

app.get('/auth/spotify/callback',
  passport.authenticate('spotify', { failureRedirect: '/' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/success');
  });

app.listen(3000, function() {
    console.log('now listening on port 3000');
});

console.log(process.env.SpotifyId);
console.log(process.env.SpotifySecret);


