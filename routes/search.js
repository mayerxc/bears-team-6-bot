const router = require('express').Router();
const axios = require('axios');
const mongoose = require('mongoose');
const User = require('../models/user');

const findUser = (userId, cb) => {
    return User.findOne({ 'slackUserId': userId }, function (err, user) {
        if (err) {
            throw err;
        }

        if (user) {
            cb(user.spotifyToken);
        } else { 
            
        }
    });    
};


const searchTracks = (search, url, token) => {    
    axios({
        method: 'get',
        url: 'https://api.spotify.com/v1/search',
        headers: {Authorization: 'Bearer ' + token},
        params: {
            q: search,
            type: 'track',
            limit: 5
        }
    }).then(function(response){ 
        let data = response.data.tracks.items.map((item) => {
            return {
                    "text": `${item.artists[0].name} - ${item.name}`,
                    "image_url": item.album.images[2].url,
                    "fallback": "You are unable to choose a game",
                    "callback_id": "wopr_game",
                    "color": "#3AA3E3",
                    "attachment_type": "default",
                    "actions": [
                        {
                            "name": "track",
                            "text": "add to playlist",
                            "style": "danger",
                            "type": "button",
                            "value": item.uri,
                            "confirm": {
                                "title": "Are you sure?",
                                "text": `Are you sure that you want to add ${item.artists[0].name} - ${item.name} to the playlist?`,
                                "ok_text": "Yes",
                                "dismiss_text": "No"
                            }
                        }
                    ]               
            };
        });
        
        axios({
            method: 'post',
            url: url,
            headers: {'content-type': 'application/json'},
            data: {
                "text": "Search results for '" + search + "':",
                "attachments": data
            }
        });         
                   
    });   
};

const searchArtists = (search, url, token) => {
    
};

router.route('/')
    .post((req,res) => {
        if (req.body.text) {
            let params = req.body.text;
            params = params.replace(/\W+/g, ' ').split(' ');
            
            let search;

            switch (params[0]) {
                case 'artist':
                    if (params.length < 2) return;
                    search = params.slice(1).join(' ');
                    findUser(req.body.user_id, searchArtists.bind(null, search));
                    break;
                case 'track':
                    if (params.length < 2) return;
                    search = params.slice(1).join(' ');
                    findUser(req.body.user_id, searchTracks.bind(null, search, req.body.response_url));
                    break;
                default:
                    search = params.slice(0).join(' ');
                    findUser(req.body.user_id, searchTracks.bind(null, search));
            }
        }
    });

module.exports = router;    