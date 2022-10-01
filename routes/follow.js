const express = require('express')
const router = express.Router()
const folderController = require('../controllers/folder') 
const followController = require('../controllers/follow') 
const { ensureAuth } = require('../middleware/auth')
const { ensureTwitch } = require('../middleware/twitchAuth')

router.get('/', ensureTwitch, ensureAuth, folderController.getFolders)

router.post('/createFollow', ensureTwitch, ensureAuth, followController.createFollow)

// router.put('/updatefollows', ensureTwitch, ensureAuth, followController.updateFollows)
router.get('/updatefollow', ensureTwitch, ensureAuth, followController.updateFollows)

module.exports = router