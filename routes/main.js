const express = require('express')
const router = express.Router()
const authController = require('../controllers/auth') 
const homeController = require('../controllers/home')
const { ensureAuth, ensureGuest } = require('../middleware/auth')

router.get('/', homeController.getIndex)
router.get('/login', authController.getLogin)
router.post('/login', authController.postLogin)
router.get('/logout', authController.logout)
router.get('/signup', authController.getSignup)
router.post('/signup', authController.postSignup)
router.get('/forgot', authController.getPasswordForgot)
router.post('/forgot', authController.postPasswordForgot)
router.get('/reset/:token', authController.getPasswordReset)
router.post('/reset/:token', authController.postPasswordReset)


// old code, for use with authorization code flow 
// see Twitch API documentation for more info
// router.get('/auth', folderController.getTwitchAuthorization)
// router.get('/auth/callback', folderController.getTwitchAuthCallback)

module.exports = router