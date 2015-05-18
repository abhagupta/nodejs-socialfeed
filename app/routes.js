let isLoggedIn = require('../app/middlewares/isLoggedIn')
let posts = require('../data/posts')
let Twitter = require('twitter')
let Facebook = require('facebook-node-sdk')
let then = require('express-then')

let networks = {
    twitter: {
            icon: 'twitter',
            name: 'Twitter',
            class: 'btn-primary'
    }
}

module.exports = (app) => {
    let passport = app.passport
    let twitterConfig = app.config.auth.twitterAuth

    console.log("twitter confi:" + twitterConfig)

    app.get('/', (req, res) => res.render('index.ejs'))

    app.get('/profile', isLoggedIn, (req, res) => {
        res.render('profile.ejs', {
            user: req.user,
            message: req.flash('error')
        })
    })

    app.get('/logout', (req, res) => {
        req.logout()
        res.redirect('/')
    })

    app.get('/login', function(req, res) {
        res.render('login.ejs', {
            message: req.flash('error')
        });
    })

    app.post('/login', passport.authenticate('local', {
        successRedirect: '/timeline',
        failureRedirect: '/login',
        failureFlash: true
    }))

    app.get('/signup', (req, res) => {
        res.render('signup.ejs', {
            message: req.flash('error')
        })
    })

     app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/timeline',
        failureRedirect: '/signup',
        failureFlash: true
    }))

    /*
     *  Facebook signin
     */

    let scope = 'email'

    // Authentication route & Callback URL
    app.get('/auth/facebook', passport.authenticate('facebook', {
        scope: 'email'
    }));

    app.get('/auth/facebook/callback', passport.authenticate('facebook', {
        successRedirect: '/profile',
        failureRedirect: '/profile',
        failureFlash: true
    }))

    // Authorization route & Callback URL
    app.get('/connect/facebook', passport.authorize('facebook', {
        scope
    }))
    app.get('/connect/facebook/callback', passport.authorize('facebook', {
        successRedirect: '/profile',
        failureRedirect: '/profile',
        failureFlash: true
    }))

    /*
     * Google Signin
     */

    app.get('/auth/google',
        passport.authenticate('google', {
            scope: ['https://www.googleapis.com/auth/plus.login']
        }));


    app.get('/oauth2callback',
        passport.authenticate('google', {
            successRedirect: '/profile',
            failureRedirect: '/profile',
            failureFlash: true
        }))

    /*
     *  Twitter routes
     */

    app.get('/auth/twitter',
        passport.authenticate('twitter'));


    app.get('/auth/twitter/callback',
        passport.authenticate('twitter', {
            successRedirect: '/profile',
            failureRedirect: '/profile',
            failureFlash: true
        }))

    /*
     *  Timelines - Twitter
     */

    app.get('/timeline', isLoggedIn, then(async(req, res) => {
        try {
            let twitterClient = new Twitter({
                consumer_key: twitterConfig.consumerKey,
                consumer_secret: twitterConfig.consumerSecret,
                access_token_key: '124222716-FI6q29IRSNc5DSwiCWbgkulfnFnt9LBurWPPxzFq',
                access_token_secret: 'JzLcLET42QHyVUF4pBNoJwOkj8QLM2EJlyvfGGWUCQ3nL',
            })

            let [tweets] = await twitterClient.promise.get('/statuses/home_timeline')

            //console.log("CLass:" + JSON.stringify(tweets))
            let mapResults = tweets.map(tweet => {
                return {
                    id: tweet.id_str,
                    image: tweet.user.profile_image_url,
                    text: tweet.text,
                    name: '@' + tweet.user.screen_name,
                    liked: tweet.favorited,
                    network: networks.twitter

                }

            })

            console.log("MAP RESULTS: " + mapResults)

            res.render('timeline.ejs', {
                posts: mapResults
            })
        } catch (e) {
            console.log(e)
        }
    }))

    app.get('/compose', isLoggedIn, (req, res) => {
        res.render('compose.ejs', {
            message: req.flash('error')
        })
    })

    app.post('/compose', isLoggedIn, then(async(req, res) => {
        try {
            let twitterClient = new Twitter({
                consumer_key: twitterConfig.consumerKey,
                consumer_secret: twitterConfig.consumerSecret,
                access_token_key: '124222716-FI6q29IRSNc5DSwiCWbgkulfnFnt9LBurWPPxzFq',
                access_token_secret: 'JzLcLET42QHyVUF4pBNoJwOkj8QLM2EJlyvfGGWUCQ3nL',
            })

            let status = req.body.text
            await twitterClient.promise.post('/statuses/update', {
                status
            })
            res.redirect('/timeline')
        } catch (e) {
            console.log(e)
        }

    }))

    app.post('/like/:id', isLoggedIn, then(async(req, res) => {
        try {
            let twitterClient = new Twitter({
                consumer_key: twitterConfig.consumerKey,
                consumer_secret: twitterConfig.consumerSecret,
                access_token_key: '124222716-FI6q29IRSNc5DSwiCWbgkulfnFnt9LBurWPPxzFq',
                access_token_secret: 'JzLcLET42QHyVUF4pBNoJwOkj8QLM2EJlyvfGGWUCQ3nL',
            })


            await twitterClient.promise.post('/favorites/create.json', {
                id: req.params.id
            })

            res.end();
        } catch (e) {
            console.log(e)
        }

    }))

    app.post('/unlike/:id', isLoggedIn, then(async(req, res) => {
        let twitterClient = new Twitter({
            consumer_key: twitterConfig.consumerKey,
            consumer_secret: twitterConfig.consumerSecret,
            access_token_key: '124222716-FI6q29IRSNc5DSwiCWbgkulfnFnt9LBurWPPxzFq',
            access_token_secret: 'JzLcLET42QHyVUF4pBNoJwOkj8QLM2EJlyvfGGWUCQ3nL',
        })
        await twitterClient.promise.post('/favorites/destroy', {
            id: req.params.id
        })
        res.end()
    }))

    app.get('/reply/:id', function(req, res) {

        let post = {
            message: req.flash('error'),
            id: req.params.id,
            image: 'test'

        }
        res.render('reply.ejs', {
            post: post
        });
    })


    app.post('/reply/:id', isLoggedIn, then(async(req, res) => {

        let twitterClient = new Twitter({
            consumer_key: twitterConfig.consumerKey,
            consumer_secret: twitterConfig.consumerSecret,
            access_token_key: '124222716-FI6q29IRSNc5DSwiCWbgkulfnFnt9LBurWPPxzFq',
            access_token_secret: 'JzLcLET42QHyVUF4pBNoJwOkj8QLM2EJlyvfGGWUCQ3nL',
        })

        let reply = req.body.reply
        await twitterClient.promise.post('/statuses/update', {
            status: reply,
            in_reply_to_status_id: req.params.id

        })
        res.redirect('/timeline')
        res.end()
    }))

    /*
     * Facebook posts and feeds sync
     */

    app.use(Facebook.middleware({
        appId: '812881395467161',
        secret: '66168284ca9966a563f5b5e13a5a8e37'
    }));

    app.get('/', Facebook.loginRequired(), function(req, res) {
        req.facebook.api('/me', function(err, user) {
            res.writeHead(200, {
                'Content-Type': 'text/plain'
            });
            res.end('Hello, ' + user.name + '!');
        });
    });



}
