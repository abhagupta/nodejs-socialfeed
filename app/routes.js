let isLoggedIn = require('../app/middlewares/isLoggedIn')
let posts = require('../data/posts')
let User = require('./models/user')
let Twitter = require('twitter')
let FB = require('fb')
let then = require('express-then')

let networks = {
    twitter: {
        icon: 'twitter',
        name: 'Twitter',
        class: 'btn-primary'
    },
    facebook: {
        icon: 'facebook',
        name: 'Facebook',
        class: 'btn-primary'
    }
}

module.exports = (app) => {
    let passport = app.passport
    let twitterConfig = app.config.auth.twitterAuth
    let facebookConfig = app.config.auth.facebookAuth

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
        successRedirect: '/',
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
     *  Timelines 
     */

    app.get('/timeline', isLoggedIn, then(async(req, res) => {

        let id = req.user._id;
        let user = await User.promise.findById(id)

        try {
            let twitterClient = new Twitter({
                consumer_key: twitterConfig.consumerKey,
                consumer_secret: twitterConfig.consumerSecret,
                access_token_key: user.twitter.token,   // '124222716-FI6q29IRSNc5DSwiCWbgkulfnFnt9LBurWPPxzFq',
                access_token_secret: 'JzLcLET42QHyVUF4pBNoJwOkj8QLM2EJlyvfGGWUCQ3nL',
            })

            let [tweets] = await twitterClient.promise.get('/statuses/home_timeline')

            //console.log("CLass:" + JSON.stringify(tweets))
            let twitterMapResults = tweets.map(tweet => {
                return {
                    id: tweet.id_str,
                    image: tweet.user.profile_image_url,
                    text: tweet.text,
                    name: '@' + tweet.user.screen_name,
                    date: new Date(tweet.created_at),
                    liked: tweet.favorited,
                    network: networks.twitter

                }

            })

            /*
             * Facebook posts retriv
             */


            FB.setAccessToken('CAALjT7LSQ5kBADnIgV7AQHzHQRE19xr3AzOPmYaxZB63EXhHwtPZC1Gf487r1ntlUuTSJEWKZA9Viu7HIUZBZAvLOQwHHzZCJwL948EHUNgntyCKeWYROPnVRI56vwaHBjXBQfpJ4ZAlhEXOrQ4JsURJVQXHaO8Sda56W2gRxw1RZBo7KLMVg2IKiHUNdxeoiSZBaszrHo9pPKVwO0lDRlEPE');
            var opts = {
                'appId':   facebookConfig.consumerKey,  //'812881395467161',
                'secret':  facebookConfig.consumerSecret ,  ///'66168284ca9966a563f5b5e13a5a8e37',
                'redirectUri': facebookConfig.callbackUrl , //'http://socialfeed.com:8000/auth/facebook/callback',
                'scope': 'user_about_me, public_profile, user_posts, read_stream'

            }

            let response = await new Promise((resolve, reject) => FB.api('/me/home', resolve))
            let facebookResults = response.data

            let facebookMapResults = facebookResults.map(post => {
                return {
                    id: post.id,
                    image: post.picture,
                    text: post.message,
                    name: '@' + post.from.name,
                    date: new Date(post.created_time),
                    network: networks.facebook
                }

            })

            posts = twitterMapResults.concat(facebookMapResults)
            posts.sort(function(a, b) {
                return new Date(b.date) - new Date(a.date);
            })
            res.render('timeline.ejs', {
                posts: posts
            })


            // FB.api('/me/home', opts, 'get', function(results) {
            //     let facebookResults = results.data;

            //     console.log("Results from facebook: " + JSON.stringify(results))
            //     let facebookMapResults = facebookResults.map(post => {
            //         return {
            //             id: post.id,
            //             image: post.picture,
            //             text: post.story,
            //             name: '@' + post.from.name,
            //             date: new Date(post.created_time),
            //             network: networks.facebook
            //         }

            //     })

            //     posts = twitterMapResults.concat(facebookMapResults)
            //     posts.sort(function(a, b) {
            //         // Turn your strings into dates, and then subtract them
            //         // to get a value that is either negative, positive, or zero.
            //         return new Date(b.date) - new Date(a.date);
            //     })
            //     res.render('timeline.ejs', {
            //         posts: posts
            //     })
            // })



        } catch (e) {
            console.log(e)
        }
    }))

    app.get('/compose/:type', isLoggedIn, (req, res) => {
        res.render('compose.ejs', {
            message: req.flash('error'),
            type: req.params.type
        })
    })

    app.post('/compose/:type', isLoggedIn, then(async(req, res) => {
        let type = req.params.type
        let id = req.user._id;
        let user = await User.promise.findById(id)
        let status = req.body.text
        try {
            if (type === 'twitter') {
                let twitterClient = new Twitter({
                    consumer_key: twitterConfig.consumerKey,
                    consumer_secret: twitterConfig.consumerSecret,
                    access_token_key: user.twitter.token,
                    access_token_secret: 'JzLcLET42QHyVUF4pBNoJwOkj8QLM2EJlyvfGGWUCQ3nL',
                })


                await twitterClient.promise.post('/statuses/update', {
                    status
                })
                res.redirect('/timeline')
            } else if (type === 'facebook') {
                FB.setAccessToken('CAALjT7LSQ5kBADnIgV7AQHzHQRE19xr3AzOPmYaxZB63EXhHwtPZC1Gf487r1ntlUuTSJEWKZA9Viu7HIUZBZAvLOQwHHzZCJwL948EHUNgntyCKeWYROPnVRI56vwaHBjXBQfpJ4ZAlhEXOrQ4JsURJVQXHaO8Sda56W2gRxw1RZBo7KLMVg2IKiHUNdxeoiSZBaszrHo9pPKVwO0lDRlEPE');
                var opts = {
                    'appId': facebookConfig.consumerKey,
                    'secret': facebookConfig.consumerSecret ,
                    'redirectUri': facebookConfig.callbackUrl ,
                    'scope': 'email, publish_actions, user_posts, user_likes, read_stream'

                }

                // let response = await new Promise((resolve, reject) => {
                //     FB.api('/me/feed?&message=' + status,  'post')
                //     resolve
                // })
                // console.log("RESPONSE FROM FACEBOOK :" + JSON.stringify(response))


                FB.api('/me/feed?&message=' + status, 'post', function(result) {

                    if (!result) {
                        return res.send(500, 'error');
                    } else if (result.error) {
                        if (result.error.type == 'OAuthException') {
                            result.redirectUri = FB.getLoginUrl(opts);
                        }
                    }
                    res.redirect('/timeline')
                })
            }

        } catch (e) {
            console.log(e)
        }

    }))

    app.post('/like/:type/:id', isLoggedIn, then(async(req, res) => {
        let type = req.params.type
        let id = req.params.id
         let userId = req.user._id;
        let user = await User.promise.findById(userId)
        try {
            if (type === 'twitter') {
                let twitterClient = new Twitter({
                    consumer_key: twitterConfig.consumerKey,
                    consumer_secret: twitterConfig.consumerSecret,
                    access_token_key: user.twitter.token,
                    access_token_secret: 'JzLcLET42QHyVUF4pBNoJwOkj8QLM2EJlyvfGGWUCQ3nL',
                })

                await twitterClient.promise.post('/favorites/create.json', {
                    id: id
                })

                res.end();
            } else if (type === 'facebook') {
                FB.setAccessToken('CAALjT7LSQ5kBAOtKDIifZAasZAED5Q579DLV7loKgnTdYEhLWZCASSoByOGVfiU0vK5DVXc3O9h0I8bpNWkPOPIJjOWzmMBQmF1SG0eNwe0zysutBtEI2piUS9ajYlpO7X6OEZBjo6lFH9l5ZCm6UwzvdjAkTwhmRHP9SjB4Vph2NUyDFPf3HKKmQNYLARPutOHqDVQ5ZAZATxsZAruIyA90gvQfORCcxUIZD');
                var opts = {
                    
                    'appId': facebookConfig.consumerKey,
                    'secret': facebookConfig.consumerSecret ,
                    'redirectUri': facebookConfig.callbackUrl ,
                    'scope': 'email, publish_actions, user_posts, user_likes, read_stream'

                }

                // let response = await new Promise((resolve, reject) => {
                //     FB.api('/me/feed?&message=' + status,  'post')
                //     resolve
                // })
                // console.log("RESPONSE FROM FACEBOOK :" + JSON.stringify(response))

                id = id.substring(0, id.indexOf("_"))
                FB.api('/me/' + id + '/likes', 'post', function(result) {

                    if (!result) {
                        return res.send(500, 'error');
                    } else if (result.error) {
                        if (result.error.type == 'OAuthException') {
                            result.redirectUri = FB.getLoginUrl(opts);
                        }
                    }
                    res.redirect('/timeline')
                })
            }

        } catch (e) {
            console.log(e)
        }

    }))

    app.post('/unlike/:type/:id', isLoggedIn, then(async(req, res) => {
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

    app.get('/reply/:type/:id', function(req, res) {



        let post = {
            message: req.flash('error'),
            id: req.params.id,
            image: 'test',
            type: req.params.type
        }
        res.render('reply.ejs', {
            post: post
            
        });
    })


    app.post('/reply/:type/:id', isLoggedIn, then(async(req, res) => {
        let type = req.params.type
        let id = req.params.id
        let reply = req.body.reply
        if (type === 'twitter') {
            let twitterClient = new Twitter({
                consumer_key: twitterConfig.consumerKey,
                consumer_secret: twitterConfig.consumerSecret,
                access_token_key: '124222716-FI6q29IRSNc5DSwiCWbgkulfnFnt9LBurWPPxzFq',
                access_token_secret: 'JzLcLET42QHyVUF4pBNoJwOkj8QLM2EJlyvfGGWUCQ3nL',
            })

            
            await twitterClient.promise.post('/statuses/update', {
                status: reply,
                in_reply_to_status_id: req.params.id

            })
        }else if (type === 'google'){
             FB.setAccessToken('CAALjT7LSQ5kBAOtKDIifZAasZAED5Q579DLV7loKgnTdYEhLWZCASSoByOGVfiU0vK5DVXc3O9h0I8bpNWkPOPIJjOWzmMBQmF1SG0eNwe0zysutBtEI2piUS9ajYlpO7X6OEZBjo6lFH9l5ZCm6UwzvdjAkTwhmRHP9SjB4Vph2NUyDFPf3HKKmQNYLARPutOHqDVQ5ZAZATxsZAruIyA90gvQfORCcxUIZD');
                var opts = {
                    'method': 'POST',
                    'appId': '812881395467161',
                    'secret': '66168284ca9966a563f5b5e13a5a8e37',
                    'redirectUri': 'http://socialfeed.com:8000/auth/facebook/callback',
                    'scope': 'email, publish_actions, user_posts, user_likes, read_stream'

                }
                FB.api('/me/' + id + '/comments/message='+reply, 'post', function(result) {

                    if (!result) {
                        return res.send(500, 'error');
                    } else if (result.error) {
                        if (result.error.type == 'OAuthException') {
                            result.redirectUri = FB.getLoginUrl(opts);
                            console.log('Redirect Url :' + result.redirectUri);
                        }
                    }
                    console.log("Facebook results for reply : " + JSON.stringify(result))
                    res.redirect('/timeline')
                })
        }

        res.redirect('/timeline')
        res.end()
    }))

   


}
