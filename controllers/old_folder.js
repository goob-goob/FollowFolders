const Folder = require('../models/Folder')

module.exports = {
    getFolders: async (req,res)=>{
        console.log(req.user)
        try{
            
            res.redirect('/auth')
            // res.render('folders.ejs', { folder: ['todo'], left: ['todo'], user: req.user })
        }catch(err){
            console.log(err)
        }
    },
    createFolder: async (req, res)=>{
        try{
        //     await Folder.create({todo: req.body.todoItem, completed: false, userId: req.user.id})
        //     console.log('Todo has been added!')
        //     res.redirect('/todos')
        }catch(err){
            console.log(err)
        }
    },
    markComplete: async (req, res)=>{
        try{
            // await Todo.findOneAndUpdate({_id:req.body.todoIdFromJSFile},{
            //     completed: true
            // })
            // console.log('Marked Complete')
            // res.json('Marked Complete')
        }catch(err){
            console.log(err)
        }
    },
    markIncomplete: async (req, res)=>{
        try{
            // await Todo.findOneAndUpdate({_id:req.body.todoIdFromJSFile},{
            //     completed: false
            // })
            // console.log('Marked Incomplete')
            // res.json('Marked Incomplete')
        }catch(err){
            console.log(err)
        }
    },
    deleteFolder: async (req, res)=>{
        console.log(req.body.todoIdFromJSFile)
        try{
            // await Todo.findOneAndDelete({_id:req.body.todoIdFromJSFile})
            // console.log('Deleted Todo')
            // res.json('Deleted It')
        }catch(err){
            console.log(err)
        }
    },
    getTwitchAuthorization: async (req, res) => {
        res.redirect(process.env.GET_TOKEN)
    },
    getTwitchAuthCallback: async (req, res) => {
        const code = req.query.code
        const token = await getToken(code)
        // const loginName = await getLoginName(token)
        const userInfo = await getUserInfo(token)
        console.log(userInfo)
        const loginName = await userInfo[0].login
        const userID = await userInfo[0].id
        console.log(loginName)
        console.log(userID)
        
        if(req.user.userName === loginName) {
            
            const userFollows = await getFollows(userID, token)

            res.render('folders.ejs', { user: req.user.userName, twitchAuthed: true })
        } else {
            res.render('folders.ejs', { 
                user: req.user.userName, 
                twitchAuthed: false,
                follows: userFollows,
             })
        }
    },
    getFollows: async 

}    

const getToken = async (code) => {
    console.log(`func getToken`)
    console.log(`--- func getToken: ${code}`)
    const response = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&code=${code}&grant_type=authorization_code&redirect_uri=http://localhost:${process.env.PORT}`, {
        method: 'POST',
        // headers: {
        //     'Authorization': `Bearer ${accessToken}`,
        // }
    })
   
    const data = await response.json()
    console.log(`func getToken() ---> data:`)
    console.log(data)
    
    // console.log(`--- func getToken: ${accessToken}`)
    // console.log(`returning from getToken: ${data.access_token}`)
    return data.access_token
}

const getUserInfo = async (token) => {
    const request = await fetch(`https://api.twitch.tv/helix/users`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Client-Id': `${process.env.CLIENT_ID}`
        }
    })

    const userdata = await request.json()

    console.log(userdata)

    return userdata.data
}

const getLoginName = async (token) => {
    const request = await fetch(`https://api.twitch.tv/helix/users`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Client-Id': `${process.env.CLIENT_ID}`
        }
    })

    const userdata = await request.json()

    return userdata.data[0].login
}

const getUserId = async () => {
    console.log('func getUserId()')
    const request = await fetch(`https://api.twitch.tv/helix/users`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Client-Id': `${process.env.CLIENT_ID}`
        }
    })

    console.log(request)
    console.log('id:\n' + id)
    console.log('returning from func getUserId()')

    return id
}

const getFollows = async (loginName, accessToken, cursor = '') => {
    console.log(`func getFollows(${loginName})`)
    console.log()
    const follows = await fetch(`https://api.twitch.tv/helix/users/follows?from_id=${loginName}&first=100`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Client-Id': `${process.env.CLIENT_ID}`
        }
    })
    const followsData = await follows.json()
    console.log(followsData)

    if(followsData.total > 100) {
        // the amount of follows over 100
        const additionalFollowCount = followsData.total - 100
        const pollCount = Math.floor(additionalFollowCount / 100)
        let nextPagination = followsData.pagination
        for(let i = 0; i < pollCount; i++) {

        }
    }

    if(followsData.pagination) {
        console.log(`user has too many follows! code needs update!`)
    } else { console.log('user follow list complete')}
    console.log('Returning from func getFollows()')
    return followsData.data
}