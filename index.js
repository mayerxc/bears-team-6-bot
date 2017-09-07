const passport = require('passport');
const SpotifyStrategy = require('passport-spotify').Strategy;
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/user');
require('dotenv').load();

mongoose.connect('mongodb://localhost:5000/spotifyJukebox');
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


app.use('/search', require('./routes/search'));
app.use('/action', require('./routes/action'));
app.get('/add', (req, res) => {
    console.log('uri: ', req.query.uri);
    console.log('spotifyId: ', req.query.spotifyId);
    console.log('playlistId: ', req.query.playlistId);
});

// TODO: Does this need to return anything?
// TODO: factor out find user and not found/log-in message
app.post('/recentlyPlayed', function (req, res){
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

app.post('/createPlaylist', function (req, res) {
    User.findOne({
        'slackUserId': req.body.user_id
    }, function (err, user) {
        if (err) {
            throw err;
        }
        var playlistName = req.body.team_domain + '_' + req.body.channel_name;
        if (user) {
            axios({
                method: 'post',
                url: 'https://api.spotify.com/v1/users/' + user.spotifyId + '/playlists',
                headers: {
                    Authorization: 'Bearer ' + user.spotifyToken,
                    'content-type': 'application/json'
                },
                data: {
                    name: playlistName,
                    public: false,
                    collaborative: true
                }
            }).then(function (response) {
                var playlistUrl = response.data.external_urls.spotify;

                axios({
                    method: 'post',
                    url: req.body.response_url,
                    headers: {
                        'content-type': 'application/json'
                    },
                    data: {
                        text: 'Success! Check out your new playlist ' + playlistUrl
                    }
                });
            });

        } else {
            axios({
                method: 'post',
                url: req.body.response_url,
                headers: {
                    'content-type': 'application/json'
                },
                data: {
                    text: 'Please sign up with /login'
                }
            });
        }
    });
});

app.get('/auth/spotify/',  
  function(req, res, next){    
    passport.authenticate('spotify', {
        scope: ['user-read-email', 'user-read-private', 'user-read-recently-played', 'playlist-modify-private', 'playlist-modify-public'],
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
    const url = 'http://4dd87f57.ngrok.io/auth/spotify?userName=' + req.body.user_name + '&userId=' + req.body.user_id + '&teamName=' + req.body.team_domain + '&channelName=' + req.body.channel_name + '&responseUrl=' + req.body.response_url;
    
    const responseObj = {
        'text': 'Click the link below to login',
        'attachments': [{
            'title': 'Login',
            'title_link': url
        }]    
    }
    return res.send(responseObj);
});

app.listen(3000, function() {
    console.log('now listening on port 3000');
});


