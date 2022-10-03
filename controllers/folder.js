const { application } = require('express')
const Folder = require('../models/Folder')
const Access = require('../models/Access')
const Follow = require('../models/Follow')
const fetch = require('node-fetch');
// const follow = require('./follow');
const MAX = 100; // used when getting list of follows, the twitch api returns up to 100 at a time


module.exports = {
    getFolders: async (req, res) => {
        // console.log(req)
        console.log('getFolders: ')
        // console.log(req.user)


        // console.log(req.query.folders) //use this to send the user to a different folder
        try {
            const folder = req.query.folders
            // console.log(`QUERY ~~~~~ ${}`)
            console.log(`folder = ${folder}`)



            const token = await Access.find({ token: { $exists: true } })

            // token[0].token is the token, duh!
            const userData = await getUserInfo(req.user.userName, token[0].token)
            console.log(userData)

            if (req.user.userName !== userData[0].login) {
                console.log('Username does not match twitch information')
                res.redirect('/')
            }

            const twitchID = userData[0].id
            const follows = await getFollows(twitchID, token[0].token)

            // console.log(follows)

            const defaultFolder = await Folder.find({ name: 'uncategorized', follower: req.user.userName })
            if (!defaultFolder.length) {
                await Folder.create({ name: 'uncategorized', follower: req.user.userName })
            }

            // checks our list against the database list,
            // adding new entries
            await checkFollows(follows, req.user.userName)

            const dbFolderList = await Folder.find({ follower: req.user.userName })
            const dbFollowList = folder ? await Follow.find({ follower: req.user.userName, parentFolder: folder }) :
                await Follow.find({ follower: req.user.userName, parentFolder: "uncategorized" })

            res.render('folders.ejs', {
                user: req.user.userName,
                follows: dbFollowList,
                folders: dbFolderList,
                current: folder ? folder : 'uncategorized'
            })

        } catch (err) {
            console.log(err)
        }
    },
    createFolder: async (req, res) => {
        try {
            const newFolder = await Folder.create({ name: req.body.folder, follower: req.user.userName })
            // console.log(newFolder)

            res.redirect('/folders')
        } catch (err) {
            console.log(err)
        }
    },
    deleteFolder: async (req, res) => {
        try {
            console.log(`deleteFolder... ${req.query.folderToDelete}`)

            const folderToDelete = req.query.folderToDelete
            const followsToMove = await Follow.find({ folder: folderToDelete, follower: req.user.userName })
   
            const update = await Follow.updateMany({ parentFolder: folderToDelete , follower: req.user.userName}, { $set: { "parentFolder": "uncategorized" } })
            // console.log(update)

            const deleted = await Folder.deleteOne({ name: folderToDelete, follower: req.user.userName })
            // console.log(deleted)
            
            res.redirect('/folders/manage')
        } catch (err) {
            console.log(err)
        }
    },
    manageFolders: async (req, res) => {
        try {
            const token = await Access.find({ token: { $exists: true } })

            // token[0].token is the token, duh!
            const userData = await getUserInfo(req.user.userName, token[0].token)

            if (req.user.userName !== userData[0].login) {
                console.log('Username does not match twitch information')
                res.redirect('/')
            }

            const dbFolderList = await Folder.find({ follower: req.user.userName })

            res.render('manage.ejs', {
                user: req.user.userName,
                folders: dbFolderList,
            })
        } catch (error) {
            console.log(error)
        }
    },
}

const getUserInfo = async (userName, token) => {
    try {
        const request = await fetch(`https://api.twitch.tv/helix/users?login=${userName}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Client-Id': `${process.env.CLIENT_ID}`
            }
        })
    
        const userdata = await request.json()
        
        return userdata.data
    } catch (error) {
        console.log(error)
    }

    // console.log(userdata)

}

const getFollows = async (loginName, accessToken, cursor = '') => {
    // console.log(`func getFollows(${loginName})`)
    // console.log()

    let follows;

    if (cursor) {
        follows = await fetch(`https://api.twitch.tv/helix/users/follows?from_id=${loginName}&first=${MAX}&after=${cursor}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Client-Id': `${process.env.CLIENT_ID}`
            }
        })
    } else {
        follows = await fetch(`https://api.twitch.tv/helix/users/follows?from_id=${loginName}&first=${MAX}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Client-Id': `${process.env.CLIENT_ID}`
            }
        })

    }
    let followsData = await follows.json()

    if (followsData.pagination.cursor) {
        const additional = await getFollows(loginName, accessToken, followsData.pagination.cursor)
        const finished = followsData.data.concat(additional)
        return finished
    }
    return followsData.data
}

const checkFollows = async (listArray, user) => {
    console.log('func checkFollows...')
    // loop through the list, 
    // console.log(listArray)

    const dbFollows = await Follow.find({ follower: user })
    // console.log(dbFollows)

    // compare the list of follows we got from twitch against
    // the list we have in the database
    // add new entries to the database if not already in 
    // compare listArray.to_login (from twitch) with dbFollows.twitchName

    for (let follow of listArray) {
        let found = await dbFollows.find(element => element.twitchName === follow.to_login)
        // console.log(follow)
        // console.log(`found? ...${found}`)

        if (!found) {
            // console.log(`creating... ${follow.to_login}`)
            await Follow.create({
                twitchName: follow.to_login,
                twitchID: follow.to_id,
                parentFolder: 'uncategorized',
                notes: "",
                follower: follow.from_login
            });
        }
    }
}