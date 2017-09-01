const router = require('express').Router();
const axios = require('axios');
const mongoose = require('mongoose');
const User = require('../models/user');

router.route('/')
    .post((req, res) => {
        let payload = JSON.parse(req.body.payload);
        let actions = payload.actions;

        if (actions[0].name == 'track') {
            res.redirect(`/add?uri=${actions[0].value}`);
        }
    });

module.exports = router;