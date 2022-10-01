const mongoose = require('mongoose')

const FolderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  // who this folder belongs to
  // uses twitch login name
  follower: {
    type: String,
    required: true
  }
})

module.exports = mongoose.model('Folder', FolderSchema)
