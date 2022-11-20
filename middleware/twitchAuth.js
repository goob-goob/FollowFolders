const Access = require('../models/Access')
const User = require('../models/User')
const fetch = require('node-fetch');

module.exports = {
    ensureTwitch: async function (req, res, next) {
    
        console.log('\nFUNCTION: ensureTwitch:')
        const twitchAccess = await Access.find( { token: { $exists: true } } )
        console.log('\ntwitchAccess:')
        console.log(twitchAccess)

        // console.log('\ntwitchAccess[0].expiration')
        // console.log(twitchAccess[0].expiration)
        
        // Is there is an access token in the database?
        if (twitchAccess.length) {
            console.log('Passed token check')
            // const twitch = await Access.findById(twitchAccess._id)

            // check if the current token has expired
            console.log()
            console.log('database token expiration:')
            console.log(twitchAccess[0].expiration)
            console.log()
            console.log('todays date:')
            console.log(Date(Date.now()))
            console.log()
            console.log('is database token expiration > today?')
            console.log(twitchAccess[0].expiration > Date.now())
            if (twitchAccess[0].expiration > Date.now()) {
                console.log('Token not yet expired.')
                next()

            // token expired? get a new one!
            } else {

                console.log('Token expired. Getting a new one.')
                
                await getNewTwitchToken(twitchAccess._id)
                next()

            }

        // If, for some reason, there is no access token in the database,
        // get a new one
        } else {
            console.log('Failed token check')
            try {

                await getNewTwitchToken(twitchAccess._id)
                next()

            } catch (error) {
                console.log(`Error within ensureTwitch:\n${error}`)
            }
        }
    }
}

const getNewTwitchToken = async (databaseID) => {
    try {
        console.log('\nFUNCTION: getNewTwitchToken databaseID === ', databaseID)
        // fetch request to get a new token
        const response = await fetch(process.env.GET_TOKEN, {
            method: 'post',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        })

        // parse the response
        const data = await response.json()
        console.log(data)

        // expiration is in seconds,
        // turn the expiration into something useable and readable
        const newExpiration = (data.expires_in * 1000) + Date.now()
        console.log(`newExpiration: ${newExpiration}`)
        const date = new Date(newExpiration)


        // update database
        console.log(`Adding token: ${data.access_token} with expiration at ${date}`)
        if(databaseID) {

            const updated = await Access.findOneAndUpdate( databaseID, { token: data.access_token, expiration: newExpiration})
            console.log(updated)
        } else {
            await Access.create( { token: data.access_token, expiration: newExpiration } )
        }

    } catch (error) {
        console.log(`Error in getNewTwitchToken:\n${error}`)
    }
}