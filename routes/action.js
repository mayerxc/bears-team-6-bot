const router = require('express').Router();
const axios = require('axios');
const mongoose = require('mongoose');
const User = require('../models/user');

router.route('/')
    .post((req, res) => {
        let payload = JSON.parse(req.body.payload);        
        let userInfo = JSON.parse(payload.actions[0].value);
        let actionResponseUrl = payload.response_url;
        console.log("action response url on action route is: " + JSON.stringify(actionResponseUrl) );

        if (payload.actions[0].name == 'track') {
            res.redirect(`/add?uri=${userInfo.uri}&spotifyId=${userInfo.spotifyId}&playlistId=${userInfo.playlistId}&actionsUrl=${actionResponseUrl}`);
        }
    });

module.exports = router;