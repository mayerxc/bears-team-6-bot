const passport = require('passport');
const SpotifyStrategy = require('passport-spotify').Strategy;
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/user');
require('dotenv').load();

mongoose.connect('mongodb://localhost:27017/spotifyJukebox');
mongoose.Promise = global.Promise;

var app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

passport.use(new SpotifyStrategy({
    clientID: process.env.SPOTIFY_ID,
    clientSecret: process.env.SPOTIFY_SECRET,
    callbackURL: 'http://localhost:3000/auth/spotify/callback',
    passReqToCallback: true   
}, function(req, accessToken, refreshToken, profile, done) {
		process.nextTick(function () {
			User.findOne({ 'spotifyId': profile.id }, function (err, user) {
				if (err) {
					return done(err);
				}

				if (user) {
                    user.spotifyToken = accessToken;

					user.save(function (err) {
						if (err) {
							throw err;
						}

						return done(null, user);
					});
				} else {
                    var state = JSON.parse(req.query.state);    
                    
                    var newUser = new User();
                    newUser.spotifyId = profile.id;
                    newUser.spotifyToken = accessToken;
                    unewUserser = Object.assign(newUser, state.slack);				

					newUser.save(function (err) {
						if (err) {
							throw err;
						}

						return done(null, newUser);
					});
				}
			});
		});
}));

app.use(session({
    secret: 'asfhhgd',
    cookie: {
        maxAge: 3600000
    }
}));
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

app.get('/success', function(req, res) {
    res.send('<h1>You have successfully logged in!!</h1>');
});

// TODO: Does this need to return anything?
// TODO: factor out find user and not found/log-in message
app.post('/recentlyPlayed', function (req, res){
    console.log(`req.body.user_id is: ${req.body.user_id} , should be slackID`);
    User.findOne({ 'slackUserId': req.body.user_id }, function (err, user) {
        if (err) {
            throw err;
        }

        if (user) {

            axios({
                method: 'get',
                url: 'https://api.spotify.com/v1/me/player/recently-played',
                headers: {Authorization: 'Bearer ' + user.spotifyToken}
            }).then(function(response){ 
                var data = [];
                response.data.items.map(function(item){
                    data.push({
                        artist: item.track.artists[0].name,
                        album: item.track.album.name,
                        song: item.track.name
                    });
                });
                
                console.log('req.body.response_url is: ' + req.body.response_url);
                axios({
                    method: 'post',
                    url: req.body.response_url,
                    headers: {'content-type': 'application/json'},
                    data: {text: JSON.stringify(data)}
                });                
            });            
        } else { 
            axios({
                method: 'post',
                url: req.body.response_url,
                headers: {'content-type': 'application/json'},
                data: {text: 'Please sign up with /login'}
            });             
        }
    });


});


//chris's try at adding a song to a playlist playlist
//Hard coded, need to get the search going first then I can refactor
app.post('/addSong', function(req, res) {
    var playlistId = '3COztoVBIDSjkct6JGHITs';
    var chris_spotify_id = 'mayerxc11';
    var track = 'spotify:track:7FpoD2ZlcBSj05rEHSZoiB'
    var addTrackUrl = `https://api.spotify.com/v1/users/${ chris_spotify_id }/playlists/${ playlistId }/tracks?uris=${ track }`;
    User.findOne({ 'slackUserId': req.body.user_id }, function (err, user) {
        if (err) {
            throw err;
        }
        if (user) {

            axios({
                method: 'post',
                url: addTrackUrl,
                headers: {Authorization: 'Bearer ' + user.spotifyToken}
            }).then(function (response) {
                axios({
                    method: 'post',
                    url: req.body.response_url,
                    headers: {'content-type': 'application/json'},
                    data: {text: 'it worked, pink song added bitches'}
                }); 
            })
                             
        } else { 
            axios({
                method: 'post',
                url: req.body.response_url,
                headers: {'content-type': 'application/json'},
                data: {text: 'Please sign up with /login, failed in adding song to playlist'}
            });
                         
        }
    });

});


app.get('/auth/spotify/', function(req, res, next) {    
    passport.authenticate('spotify', {
        scope: ['user-read-email', 'user-read-private', 'user-read-recently-played', 'playlist-modify-public'],
        showDialog: true,
        state: JSON.stringify({
            slack: {
                slackUserName: req.query.userName,
                slackUserId: req.query.userId,
                slackTeam: req.query.teamName,
                slackChannel: req.query.channelName,
            },
            responseUrl: req.query.responseUrl
        })
    })(req, res, next);
  });  

app.get('/auth/spotify/callback',
  passport.authenticate('spotify', { failureRedirect: '/' }),
  function(req, res) {
    // Successful authentication, redirect home.
    var state = JSON.parse(req.query.state);
    var responseUrl = state.responseUrl;
    axios({
        method: 'post',
        url: responseUrl,
        headers: {'content-type': 'application/json'},
        data: {text: 'You have successfully logged in'}
    }).then(function(response){
        res.redirect('/success');
    });       
  });

app.post('/login', (req, res) => {
    const url = process.env.NGROK + '/auth/spotify?userName=' + req.body.user_name + '&userId=' + req.body.user_id + '&teamName=' + req.body.team_domain + '&channelName=' + req.body.channel_name + '&responseUrl=' + req.body.response_url;
    
    const responseObj = {
        'text': 'Click the link below to login',
        'attachments': [{
            'title': 'Login',
            'title_link': url
        }]    
    }
    console.log(responseObj);
    return res.send(responseObj);
});

app.listen(3000, function() {
    console.log('now listening on port 3000');
});



