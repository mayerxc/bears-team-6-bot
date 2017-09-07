const router = require('express').Router();
const axios = require('axios');
const mongoose = require('mongoose');
const User = require('../models/user');

router.route('/')
    .post((req, res) => {
        let payload = JSON.parse(req.body.payload);        
        let userInfo = JSON.parse(payload.actions[0].value);

        if (payload.actions[0].name == 'track') {
            res.redirect(`/add?uri=${userInfo.uri}&spotifyId=${userInfo.spotifyId}&playlistId=${userInfo.playlistId}`);
        }
    });

module.exports = router;