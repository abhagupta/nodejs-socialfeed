let passport = require('passport')
let nodeifyit = require('nodeifyit')
let User = require('../models/user')
let LocalStrategy = require('passport-local').Strategy
let FacebookStrategy = require('passport-facebook').Strategy
let TwitterStrategy = require('passport-twitter').Strategy
let GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
    //let configAuth = require('../../config/auth')

require('songbird')


function useExternalPassportStrategy(OauthStrategy, config, oauthProvider) {
    config.passReqToCallback = true

    passport.use(new OauthStrategy(config, nodeifyit(authCB, {
        spread: true
    })))
    async

    function authCB(req, token, refreshToken, _ignored_, account) {
        // asynchronous verification, for effect...
        
        let loggedInUser = req.user
        if (!loggedInUser)
        {
            let user = new User()
            user[oauthProvider].id = account.id
            user[oauthProvider].token = token
            user[oauthProvider].name = account.displayName

            return await user.save()
        }
        else
        {
            loggedInUser[oauthProvider].id = account.id
            loggedInUser[oauthProvider].token = token
            loggedInUser[oauthProvider].name = account.displayName

            return await loggedInUser.save()
        }
        // query[oauthProvider + ".id"] = account.id
        // let user = await User.promise.findOne(query)
        // if (!user) {
        //     let user = new User()
        //     user[oauthProvider].id = account.id
        //     user[oauthProvider].token = token
        //     user[oauthProvider].name = account.displayName

        //     return await user.save()

        // } else {
        //     //link facebook accoutn
        //     user.linkFacebookAccount(account, token);
        // }
        //return user

    }


}




function configure(config) {
    // Required for session support / persistent login sessions
    passport.serializeUser(nodeifyit(async(user) => user.id))

    passport.deserializeUser(nodeifyit(async(id) => {
        let user = await User.promise.findById(id)
        return user
    }))


    useExternalPassportStrategy(FacebookStrategy, {
        clientID: config.facebookAuth.consumerKey,
        clientSecret: config.facebookAuth.consumerSecret,
        callbackURL: config.facebookAuth.callbackUrl, 
        passReqToCallback: true
    }, 'facebook')




    useExternalPassportStrategy(GoogleStrategy, {
        clientID: '43531689224-79vnuhs5hb92uponre8elumceigh0oes.apps.googleusercontent.com',
        clientSecret: '_e3GCM77-e-IcomOqr9mETSn',
        callbackURL: 'http://socialfeed.com:8000/oauth2callback'
    }, 'google')


    useExternalPassportStrategy(TwitterStrategy, {
        consumerKey: 'Toec1vkScZLwOR7H2vH3or7ls',
        consumerSecret: 'FeLlhlT0qVHvmcExozednLdKyuoEoTkohcGIsIczDKhwKV0AND',
        callbackURL: 'http://socialfeed.com:8000/auth/twitter/callback'
    }, 'twitter')




    return passport
}

passport.use(new LocalStrategy({
    usernameField: 'username',
    failureFlash: true

}, nodeifyit(async(username, password) => {
    let user

    let email
    if (username.indexOf('@') >= 0) {

        email = username.toLowerCase()
        let query = {
            'local.email': email
        }

        user = await User.promise.findOne({
            query
        })
    } else {

        let regexp = new RegExp(username, 'i')
        user = await User.promise.findOne({
            username: {
                $regex: regexp
            }
        })

    }

    if (!email) {
        if (!user || username != user.username) {
            return [false, {
                message: 'Invalid username'
            }]
        }
    } else {
        if (!user || email != user.local.email) {
            return [false, {
                message: 'Invalid email'
            }]
        }
    }



    if (!await user.validatePassword(password)) {
        return [false, {
            message: 'Invalid password'
        }]
    }
    return user
}, {
    spread: true
})))

passport.use('local-signup', new LocalStrategy({
    usernameField: 'email',
    failureFlash: true,
    passReqToCallback: true
}, nodeifyit(async(req, email, password) => {

    /* Do email query */
    email = (email || '').toLowerCase()
    if (await User.promise.findOne({
            email
        })) {
        return [false, "That email is already taken."]
    }

    /* set username, title, description from request body to same name parameters*/
    let {
        username, title, description
    } = req.body

    /* Do username query*/
    let regexp = new RegExp(username, 'i')
    let query = {
        username: {
            $regex: regexp
        }
    }

    if (await User.promise.findOne(query)) {
        return [false, {
            message: 'That username is already taken. '
        }]
    }


    let user = new User()
    user.local.email = email


    user.local.password = password
    try {
        return await user.save()

    } catch (e) {
        //console.log(util.inspect(e))
        return [false, {
            message: e.message
        }]
    }

    return await user.save()
}, {
    spread: true
})))


module.exports = {
    passport, configure
}
