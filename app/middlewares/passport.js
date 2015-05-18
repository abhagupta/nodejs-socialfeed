let passport = require('passport')
let nodeifyit = require('nodeifyit')
let User = require('../models/user')
let LocalStrategy = require('passport-local').Strategy
let FacebookStrategy = require('passport-facebook').Strategy
let TwitterStrategy = require('passport-twitter').Strategy
let GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
let configAuth = require('../../config/auth')

require('songbird')


function useExternalPassportStrategy(OauthStrategy, config, oauthProvider) {
    config.passReqToCallback = true
    passport.use(new OauthStrategy(config, nodeifyit(authCB, {
        spread: true
    })))
    async
    function authCB(token, refreshToken, _ignored_, account) {
        // asynchronous verification, for effect...
        console.log("Id ******************** :" + token)
        console.log('Google profile: ' + JSON.stringify(account));
        let query = {}
        query[oauthProvider+".id"] = account.id
        let user = await User.promise.findOne(query)
        if (!user) {
            let user = new User()
            user.local.email = 'abhagupta'
            user.local.password = 'test1234'
            user[oauthProvider].id = account.id
            user[oauthProvider].token = token
            user[oauthProvider].name = account.displayName

            return await user.save()

        }
        return user

    }

}


function configure(config) {
    // Required for session support / persistent login sessions
    passport.serializeUser(nodeifyit(async(user) => user.id))

    passport.deserializeUser(nodeifyit(async(id) => {
        return await User.promise.findById(id)
    }))

    useExternalPassportStrategy(FacebookStrategy, {
        clientID: '812881395467161',
        clientSecret: '66168284ca9966a563f5b5e13a5a8e37',
        callbackURL: 'http://socialfeed.com:8000/auth/facebook/callback'
    }, 'facebook')


    // useExternalPassportStrategy(FacebookStrategy, {
    //     clientID: configAuth.facebookAuth.consumerKey,
    //     clientSecret: configAuth.facebookAuth.consumerSecret,
    //     callbackURL: configAuth.facebookAuth.callbackUrl
    // }, 'facebook')


   

    useExternalPassportStrategy(GoogleStrategy, {
        clientID: '43531689224-79vnuhs5hb92uponre8elumceigh0oes.apps.googleusercontent.com',
        clientSecret: '_e3GCM77-e-IcomOqr9mETSn',
        callbackURL: 'http://socialfeed.com:8000/oauth2callback'
    }, 'google')


    useExternalPassportStrategy(TwitterStrategy, {
            consumerKey: 'Toec1vkScZLwOR7H2vH3or7ls',
            consumerSecret: 'FeLlhlT0qVHvmcExozednLdKyuoEoTkohcGIsIczDKhwKV0AND',
            callbackURL: 'http://socialfeed.com:8000/auth/twitter/callback'
        },  'twitter')
    // useExternalPassportStrategy(LinkedInStrategy, {...}, 'twitter')
    // passport.use('local-login', new LocalStrategy({...}, (req, email, password, callback) => {...}))
    // passport.use('local-signup', new LocalStrategy({...}, (req, email, password, callback) => {...}))

    return passport
}

passport.use('local-login', new LocalStrategy({
    // ...
}, nodeifyit(async(req, email, password) => {
    // ...
}, {
    spread: true
})))

passport.use('local-signup', new LocalStrategy({
    // ...
}, nodeifyit(async(req, email, password) => {
    // ...
}, {
    spread: true
})))




module.exports = {
    passport, configure
}
