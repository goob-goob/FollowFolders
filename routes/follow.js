const express = require('express')
const router = express.Router()
const folderController = require('../controllers/folder') 
const followController = require('../controllers/follow') 
const { ensureAuth } = require('../middleware/auth')
const { ensureTwitch } = require('../middleware/twitchAuth')

router.get('/', ensureTwitch, ensureAuth, folderController.getFolders)
router.get('/updatefollow', ensureTwitch, ensureAuth, followController.updateFollows)
router.post('/updatemany', ensureTwitch, ensureAuth, followController.updateMany)

module.exports = router