const { application } = require('express')
const Follow = require('../models/Follow')
const fetch = require('node-fetch')

module.exports = {

    // I don't know why the name is in plural form,
    // am too lazy to go and change it now.
    updateFollows: async (req, res) => {
        try {
            const follow = await Follow.updateOne(
                // filter/query, find this 'follow' that we want to change
                {
                    "follower": req.user.userName, 
                    "twitchName": req.query.follow
                },
                // changes go here
                {
                    $set: { 
                        "parentFolder": req.query.folder,
                        "notes": req.query.notes,
                    }
                }
            )
            // console.log(`updated? ${follow.acknowledged}`)

            // if we get a folder in the query, send back to that folder,
            // else go to /folders            
            if(req.query.current) {
                res.redirect(`/folders/?folders=${req.query.current}`)
            } else {
                res.redirect('/folders')
            }
        } catch (error) {
            console.log(error)
        }
    },

    // The actual plural form of the above function
    updateMany: async (req, res) => {
        console.log('\nupdateMany...')
        const currentFolder = req.query.current
        console.log('current folder', currentFolder)
        const followsToUpdate = req.body

        console.log(followsToUpdate)

        const updates = await updateManyFollows(followsToUpdate, req.user.userName)
        
        console.log('\nreturning from updateMany...')

        // setTimeout(() => {
        //     res.redirect('/folders')
        // }, 5000);
        
        // Promise.allSettled([updates]).then(() => res.redirect(`/folders`))
        res.send({redirect: '/folders'})
    }
}

const updateManyFollows = async (list, name) => {
    console.log('\nupdateManyFollows()')
    for(let i = 0; i < list.length; i++) {
        const follow = list[i]
        const newFolder = list[i].folder
        console.log(`updating follow: ${follow.name}`)
        console.log(`folder: ${newFolder}\nnote: ${follow.note}`)

        try {
            const update = await Follow.updateOne(
                {
                    "follower": name,
                    "twitchName": follow.name
                },
                {
                    $set: {
                        "parentFolder": newFolder,
                        "notes": follow.note
                    }
                }
                )
                
                // console.log(`updated? `, update)
            } catch (error) {
                console.log(error)
            }
    }
    console.log('Returning from updateManyFollows()')
    return
}