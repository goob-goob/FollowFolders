const { application } = require('express')
const Follow = require('../models/Follow')
const Access = require('../models/Access')
const fetch = require('node-fetch')

module.exports = {
    createFollow: (req, res) => {
        // if(req.user) { res.render('folders.ejs', { user: req.user.userName }) }
        res.render('index.ejs')
        res.redirect('/folders')
    },
    updateFollows: async (req, res) => {
        try {
            // todo
            // console.log('updateFollows: --------------------------------------------------------------------')
            // console.log(req)
            // console.log(req.body.follow)
            // console.log(req.query)

            const follow = await Follow.updateOne(
                {
                    "follower": req.user.userName, 
                    "twitchName": req.query.follow
                },
                {
                    $set: { 
                        "parentFolder": req.query.folder,
                        "notes": req.query.notes,
                    }
                }
            )

            console.log(`updated? ${follow.acknowledged}`)

            // console.log('leaving updateFollows --------------------------------------------------------------------')
            res.redirect('/folders')

        } catch (error) {
            console.log(error)
        }
    },
}