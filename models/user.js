const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    slackUserId: String,
    slackUserName: String,
    slackTeam: String,
    slackChannel: String,
    spotifyId: String,
    spotifyToken: String, // TODO: hash
    playlistId: String //added by Chris
});

module.exports = mongoose.model('User', userSchema);