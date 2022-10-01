const express = require('express')
const router = express.Router()
const folderController = require('../controllers/folder') 
const { ensureAuth } = require('../middleware/auth')
const { ensureTwitch } = require('../middleware/twitchAuth')

router.get('/', ensureTwitch, ensureAuth, folderController.getFolders)
// router.get('/folder', ensureTwitch, ensureAuth, folderController.getFolders)

// router.get('/create', ensureTwitch, ensureAuth, folderController.createFolder)

router.post('/createfolder/', ensureTwitch, ensureAuth, folderController.createFolder)

router.get('/deletefolder', ensureTwitch, ensureAuth, folderController.deleteFolder)

router.get('/manage', ensureTwitch, ensureAuth, folderController.manageFolders)

module.exports = router