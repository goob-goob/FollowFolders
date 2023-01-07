const { application } = require('express')
const Folder = require('../models/Folder')
const Access = require('../models/Access')
const Follow = require('../models/Follow')
const fetch = require('node-fetch');
const MAX = 100; // used when getting list of follows, the twitch api returns up to 100 at a time

module.exports = {
    getFolders: async (req, res) => {
        console.log('getFolders()')
        console.log('query: ', req.query)
        try {
            const folder = req.query.folders

            let token = await Access.find({ token: { $exists: true } })
            console.log(token)
            // token[0].token is the token, duh!
            // reassigning for clarity
            token = token[0].token

            const userData = await getUserInfo(req.user.userName, token)

            if (!userData) { res.redirect('/signup') }
            if (req.user.userName !== userData[0].login) {
                console.log('Username does not match twitch information')
                res.redirect('/')
            }

            console.log(userData)

            // need the twitch id to use the twitch api
            const twitchID = userData[0].id

            // get a list of the user follows
            const follows = await getFollows(twitchID, token)
            
            // looking for a default folder, in case this is the first time
            // someone has logged in. Create the folder if it IS the first time (or it has been deleted)
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

            // check for live streams from list
            const liveStreams = await getLiveStreams(follows, token)

            // get ids for livestreams, we will use this for a section that displays
            // live streams specifically
            const liveIds = []
            liveStreams.forEach(element => { liveIds.push(element.user_id) })

            // get indices for those livestreams
            let trimIndices = []
            let dbLiveList = []
            for (let i = 0; i < dbFollowList.length; i++) {
                if (liveIds.find(element => element === dbFollowList[i].twitchID)) {
                    trimIndices.push(i)
                    dbLiveList.push(dbFollowList[i])
                }
            }
        
            // trim those livestreams from dbFollowList
            trimIndices.reverse()
            for (let id of trimIndices) {
                dbFollowList.splice(id, 1)
            }

            res.render('folders.ejs', {
                user: req.user.userName,
                follows: dbFollowList,
                folders: dbFolderList,
                liveFollows: dbLiveList,
                current: folder ? folder : 'uncategorized'
            })

        } catch (err) {
            console.log(err)
        }
    },

    createFolder: async (req, res) => {
        console.log('createFolder()')
        try {
            const newFolder = await Folder.create({ name: req.body.folder, follower: req.user.userName })

            res.redirect('/folders')
        } catch (err) {
            console.log(err)
        }
    },

    deleteFolder: async (req, res) => {
        try {
            console.log(`deleteFolder( ${req.query.folderToDelete} )`)

            const folderToDelete = req.query.folderToDelete
            const followsToMove = await Follow.find({ folder: folderToDelete, follower: req.user.userName })

            const update = await Follow.updateMany({ parentFolder: folderToDelete, follower: req.user.userName }, {
                $set: { "parentFolder": "uncategorized" }
            })

            const deleted = await Folder.deleteOne({ name: folderToDelete, follower: req.user.userName })

            res.redirect('/folders/manage')
        } catch (err) {
            console.log(err)
        }
    },

    manageFolders: async (req, res) => {
        console.log('manageFolders()')
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

// // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // //
// 
// end of exports, start of functions
//
// // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // //

const getUserInfo = async (userName, token) => {
    console.log(`FUNCTION: getUserInfo()`)
    console.log('userName:')
    console.log(userName)
    console.log()
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
}

const getFollows = async (loginName, accessToken, cursor = '') => {
    console.log('getFollows()')
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

    // if there is a pagination cursor, we have hit the max we can receive from the API
    // send another request starting from the cursor and append it to our list
    if (followsData.pagination.cursor) {
        const additional = await getFollows(loginName, accessToken, followsData.pagination.cursor)
        const finished = followsData.data.concat(additional)
        return finished
    }
    return followsData.data
}

const checkFollows = async (listArray, user) => {
    console.log('checkFollows()')

    const dbFollows = await Follow.find({ follower: user })

    // compare the list of follows we got from twitch against
    // the list we have in the database
    // add new entries to the database if not already in 
    // compare listArray.to_login (from twitch) with dbFollows.twitchName
    for (let follow of listArray) {
        let found = await dbFollows.find(element => element.twitchName === follow.to_login)

        if (!found) {
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

const getLiveStreams = async (list, token, cursor = '') => {
    console.log(`getLiveStreams()`)

    const maxListLength = 100

    let array = [...list]

    let liveStreams = []

    // cycle through our list,
    // generate a list of user_id entries to send (up too 100, the max allowed by the twitch API),
    // remove entries from our 'array' list as they are added into 'ids' list,
    // send request to twitch to get streams that are live from the list we sent,
    // add data to our 'liveStreams' list, which we will return after we have gone through the 'array' list
    while (array.length) {
        let ids = []
        let length = array.length > maxListLength ? maxListLength : array.length

        for (let i = 0; i < length; i++) {
            const item = '&user_id=' + array[0].to_id
            ids.unshift(item)
            array.shift()
        }
        let requestIds = ids.join('')

        let streams = await fetch(`https://api.twitch.tv/helix/streams?first=100${requestIds}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Client-Id': `${process.env.CLIENT_ID}`
            }
        })
        
        let data = await streams.json()
        
        liveStreams = liveStreams.concat(data.data)
    }

    console.log(`returning from getLiveStreams()`)
    
    return liveStreams
}
