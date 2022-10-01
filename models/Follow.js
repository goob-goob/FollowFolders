const mongoose = require('mongoose')

const FollowSchema = new mongoose.Schema({
  // twitch user's login
  twitchName: {
    type: String,
    required: true,
  },
  // twitch user's ID
  twitchID: {
    type: String,
    required: true
  },
  // parent folder
  parentFolder: {
    type: String,
    required: true
  },
  notes: {
    type: String
  },
  // which twitch user does this entry belong to?
  // ie. who is this follow entry tied to?
  // ie. the person following this user
  // uses twitch login name
  follower: {
    type: String,
    require: true
  },
})

module.exports = mongoose.model('Follow', FollowSchema)
