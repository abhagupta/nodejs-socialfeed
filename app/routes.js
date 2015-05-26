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
        })
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
                access_token_key: user.twitter.token, // '124222716-FI6q29IRSNc5DSwiCWbgkulfnFnt9LBurWPPxzFq',
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
                'appId': facebookConfig.consumerKey, //'812881395467161',
                'secret': facebookConfig.consumerSecret, ///'66168284ca9966a563f5b5e13a5a8e37',
                'redirectUri': facebookConfig.callbackUrl, //'http://socialfeed.com:8000/auth/facebook/callback',
                'scope': 'user_about_me, public_profile, user_posts, read_stream'

            }

            let response = await new Promise((resolve, reject) => FB.api('/me/home', resolve))
            let facebookResults = response.data

            console.log("\n\n\nfacebookresults :" + JSON.stringify(facebookResults));

            let facebookMapResults = facebookResults.map(post => {
                console.log('Psot likes :' + JSON.stringify(post.likes));
                let returnPost ={
                     id: post.id,
                    image: post.picture,
                    text: post.message,
                    name: '@' + post.from.name,
                    date: new Date(post.created_time),
                   // liked: post.likes.data[0].id,
                    network: networks.facebook
                }

                return returnPost;

            })

           //likes":{"data":[{"id":"10153286634794509","name":"Abha Gupta"}]

            posts = twitterMapResults.concat(facebookMapResults)
           // posts = facebookMapResults
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
                    'secret': facebookConfig.consumerSecret,
                    'redirectUri': facebookConfig.callbackUrl,
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
                FB.setAccessToken('CAALjT7LSQ5kBALYrZA7t3i5Izf3VB9KNVvlH0T2imppIvgjB6oDoWPnAZCY4YtrMyorTvh2YOu6ZCBZCuqirZAJZAskVCIJxeI1NUbQdly5vHZBZCNZAnzqixwFdXIdS6gN7aZCpzXRWdHDBrjKp6ZA1n8i17xZBeWcllIDXlyayZAKMKr0kRdYTnvrBZBYZAxYTur9EBwVjRZBSZCohJGg6v67xqwyZArkVaufvrsQa0ZD');
                var opts = {

                    'appId': facebookConfig.consumerKey,
                    'secret': facebookConfig.consumerSecret,
                    'redirectUri': facebookConfig.callbackUrl,
                    'scope': 'email, publish_actions, user_posts, user_likes, read_stream'

                }

                let response = await new Promise((resolve, reject) => {
                    FB.api('/' + id + '/likes', 'post', resolve)
                })
                //console.log("RESPONSE FROM FACEBOOK :" + JSON.stringify(response))
                res.end()

                // FB.api('/' + id + '/likes', 'post', function(result) {

                //     if (!result) {
                //         return res.send(500, 'error');
                //     } else if (result.error) {
                //         if (result.error.type == 'OAuthException') {
                //             result.redirectUri = FB.getLoginUrl(opts);
                //         }
                //     }
                //     res.redirect('/timeline')

                //     console.log("RESPONSE :" + JSON.stringify(result))
                // })
            }

        } catch (e) {
            console.log(e)
        }

    }))

    app.post('/unlike/:type/:id', isLoggedIn, then(async(req, res) => {
        let type = req.params.type
        let id = req.params.id

        if (type === 'twitter') {
            let twitterClient = new Twitter({
                consumer_key: twitterConfig.consumerKey,
                consumer_secret: twitterConfig.consumerSecret,
                access_token_key: '124222716-FI6q29IRSNc5DSwiCWbgkulfnFnt9LBurWPPxzFq',
                access_token_secret: 'JzLcLET42QHyVUF4pBNoJwOkj8QLM2EJlyvfGGWUCQ3nL',
            })
            await twitterClient.promise.post('/favorites/destroy', {
                id: req.params.id
            })
        } else if (type === 'facebook') {

             FB.setAccessToken('CAALjT7LSQ5kBALYrZA7t3i5Izf3VB9KNVvlH0T2imppIvgjB6oDoWPnAZCY4YtrMyorTvh2YOu6ZCBZCuqirZAJZAskVCIJxeI1NUbQdly5vHZBZCNZAnzqixwFdXIdS6gN7aZCpzXRWdHDBrjKp6ZA1n8i17xZBeWcllIDXlyayZAKMKr0kRdYTnvrBZBYZAxYTur9EBwVjRZBSZCohJGg6v67xqwyZArkVaufvrsQa0ZD');
                var opts = {
                    'appId': facebookConfig.consumerKey,
                    'secret': facebookConfig.consumerSecret,
                    'redirectUri': facebookConfig.callbackUrl,
                    'scope': 'email, publish_actions, user_posts, user_likes, read_stream'
                }

                let response = await new Promise((resolve, reject) => {
                    FB.api('/' + id + '/likes', 'delete', resolve)
                })
                console.log("RESPONSE FROM FACEBOOK :" + JSON.stringify(response))
                res.end()
        }

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
        } else if (type === 'facebook') {
            FB.setAccessToken('CAALjT7LSQ5kBALYrZA7t3i5Izf3VB9KNVvlH0T2imppIvgjB6oDoWPnAZCY4YtrMyorTvh2YOu6ZCBZCuqirZAJZAskVCIJxeI1NUbQdly5vHZBZCNZAnzqixwFdXIdS6gN7aZCpzXRWdHDBrjKp6ZA1n8i17xZBeWcllIDXlyayZAKMKr0kRdYTnvrBZBYZAxYTur9EBwVjRZBSZCohJGg6v67xqwyZArkVaufvrsQa0ZD');
            var opts = {
                'method': 'POST',
                'appId': '812881395467161',
                'secret': '66168284ca9966a563f5b5e13a5a8e37',
                'redirectUri': 'http://socialfeed.com:8000/auth/facebook/callback',
                'scope': 'email, publish_actions, user_posts, user_likes, read_stream'

            }
            //id = id.substring(0, id.indexOf("_"))
            FB.api('/' + id + '/comments/' , 'post', {message:reply }, function(result) {

                if (!result) {
                    return res.send(500, 'error');
                } else if (result.error) {
                    if (result.error.type == 'OAuthException') {
                        result.redirectUri = FB.getLoginUrl(opts);
                       // console.log('Redirect Url :' + result.redirectUri);
                    }
                }
                res.redirect('/timeline')
            })
        }

        // res.redirect('/timeline')
        // res.end()
    }))

    app.get('/share/:type/:id', (req, res) => {
        let post
        res.render('share.ejs', {
            type: req.params.type,
            post: {
                image: 'test',
                name: 'test',
                id: req.params.id,
                type: req.params.type
            }
        });
    })


     app.post('/share/:type/:id', then(async(req, res) => {
        let type = req.params.type
        let id = req.params.id
        let shareLink = req.body.share
        let text = req.body.share

        if (type === 'twitter') {

        }else{
            FB.setAccessToken('CAALjT7LSQ5kBAMxhnnCNevhS7536k84yPgSGMH4t2vdwqB33CNWV5DkT8wnh3vkcr6EnKISvp1I1pZABL7u94ZC8J6rf0Fg2nquLA2MmGwDFquLTnPNd1N7CpoSNXsEBffol60VzVRfIZAfdDEBtVxKRjp7IU85ZBU6PDtH8EtFuG7D9SpeqU7yvZBVcOyObZA7uN8ufx9pZAuaHW0nwmh8eQVy0F2JTioZD');
            var opts = {
                'appId': '812881395467161',
                'secret': '66168284ca9966a563f5b5e13a5a8e37',
                'redirectUri': 'http://socialfeed.com:8000/auth/facebook/callback',
                'scope': 'email, publish_actions, user_posts, user_likes, read_stream'

            }

             let response = await new Promise((resolve, reject) => {
                    FB.api('/me/feed', 'post', {link:"http://delivery.walmart.com", message:text || "test share"}, resolve)
                })

            // console.log("Response returned from facebook :" + JSON.stringify(response));
              res.redirect('/timeline')
        }

       
    }))
}
