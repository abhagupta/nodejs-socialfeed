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
                let twitterMapResults = tweets.map(tweet => {
                    return {
                        id: tweet.id_str,
                        image: tweet.user.profile_image_url,
                        text: tweet.text,
                        name: '@' + tweet.user.screen_name,
                        liked: tweet.favorited,
                        network: networks.twitter

                    }

                })
                console.log("MAP RESULTS: " + twitterMapResults)

                /*
                 * Facebook posts retriv
                 */


                FB.setAccessToken('CAALjT7LSQ5kBADnIgV7AQHzHQRE19xr3AzOPmYaxZB63EXhHwtPZC1Gf487r1ntlUuTSJEWKZA9Viu7HIUZBZAvLOQwHHzZCJwL948EHUNgntyCKeWYROPnVRI56vwaHBjXBQfpJ4ZAlhEXOrQ4JsURJVQXHaO8Sda56W2gRxw1RZBo7KLMVg2IKiHUNdxeoiSZBaszrHo9pPKVwO0lDRlEPE');
                var opts = {
                    'appId': '812881395467161',
                    'secret': '66168284ca9966a563f5b5e13a5a8e37',
                    'redirectUri': 'http://socialfeed.com:8000/auth/facebook/callback',
                    'scope': 'user_about_me, public_profile, user_posts, read_stream'

                }
                let fbPosts = FB.promise.api('/me/posts', opts, 'get')
                fbPosts.then(function(results){
                    console.log("Results from facebook: " + results)
                }, function(error){
                    console.log("Error thrown: "+ JSON.stringify(error))

                })

            //     console.log("FBPOSTSS AAaaaaaaaaaaaaaaaaaa:" + fbPosts);
            //     let facebookMapResults = fbPosts.map(post => {
            //         return {
            //             id: post.id,
            //             text: post.message,
            //             name: '@' + post.from.name,

            //             network: networks.facebook
            //         }

            //     })

            //     console.log("Facebook Mapped results : &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&" + facebookMapResults)
            // } catch (e) {
            //     console.log(e)
            // }
            // let facebookposts
            // FB.api('/me/posts', 'get', function(result, facebookposts) {
            //     var opts = {
            //         'appId': '812881395467161',
            //         'secret': '66168284ca9966a563f5b5e13a5a8e37',
            //         'redirectUri': 'http://socialfeed.com:8000/auth/facebook/callback',
            //         'scope': 'user_about_me, public_profile, user_posts, read_stream'

            //     }
            //     if (!result) {
            //         return res.send(500, 'error');
            //     } else if (result.error) {
            //         if (result.error.type == 'OAuthException') {
            //             result.redirectUri = FB.getLoginUrl(opts);
            //             console.log('Redirect Url :' + result.redirectUri);
            //         }
            //         return res.send(500, result);
            //     }

            //     console.log('Result :' + JSON.stringify(result));
            //     console.log('Result Length :' + result.data.length);

            //     let facebookMapResults = result.data.map(post => {
            //         return {
            //             id: post.id,
            //             text: post.message,
            //             name: '@' + post.from.name,

            //             network: networks.facebook
            //         }

            //     })
            //     facebookposts = "testings"
            //     console.log("Facebook Mapped results : &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&" + facebookMapResults)


            //     //res.send(facebookMapResults)

            // });

            //console.log("facebookposts: " + facebookposts);

            res.render('timeline.ejs', {
                posts: twitterMapResults

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

// app.use(Facebook.middleware({
//     appId: '812881395467161',
//     secret: '66168284ca9966a563f5b5e13a5a8e37'
// }));

// app.get('/', Facebook.loginRequired(), function(req, res) {
//     req.facebook.api('/me', function(err, user) {
//         res.writeHead(200, {
//             'Content-Type': 'text/plain'
//         });
//         res.end('Hello, ' + user.name + '!');
//     });
// });

app.get('/feed', isLoggedIn, then(async(req, res) => {
    console.log("reached here" + req.user);

    let userId = req.user._id
    console.log('USER ID: !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! :' + userId)

    var ObjectId = require('mongoose').Types.ObjectId;

    var query = {
        "_id": new ObjectId(userId)
    };

    let dbUser = await User.promise.find({
        query
    })

    console.log("Token from DB :" + dbUser)


    FB.setAccessToken('CAALjT7LSQ5kBADnIgV7AQHzHQRE19xr3AzOPmYaxZB63EXhHwtPZC1Gf487r1ntlUuTSJEWKZA9Viu7HIUZBZAvLOQwHHzZCJwL948EHUNgntyCKeWYROPnVRI56vwaHBjXBQfpJ4ZAlhEXOrQ4JsURJVQXHaO8Sda56W2gRxw1RZBo7KLMVg2IKiHUNdxeoiSZBaszrHo9pPKVwO0lDRlEPE');


    FB.api('/me/posts', 'get', function(result) {
        var opts = {
            'appId': '812881395467161',
            'secret': '66168284ca9966a563f5b5e13a5a8e37',
            'redirectUri': 'http://socialfeed.com:8000/auth/facebook/callback',
            'scope': 'user_about_me, public_profile, user_posts, read_stream'

        }
        if (!result) {
            return res.send(500, 'error');
        } else if (result.error) {
            if (result.error.type == 'OAuthException') {
                result.redirectUri = FB.getLoginUrl(opts);
                console.log('Redirect Url :' + result.redirectUri);
            }
            return res.send(500, result);
        }

        console.log('Result :' + JSON.stringify(result));

        //let posts =



        res.send(result);
    });

}))



}

// function getFeed(url){
//     return new Promise(function(resolve, reject){
//         FB.setAccessToken('CAALjT7LSQ5kBADnIgV7AQHzHQRE19xr3AzOPmYaxZB63EXhHwtPZC1Gf487r1ntlUuTSJEWKZA9Viu7HIUZBZAvLOQwHHzZCJwL948EHUNgntyCKeWYROPnVRI56vwaHBjXBQfpJ4ZAlhEXOrQ4JsURJVQXHaO8Sda56W2gRxw1RZBo7KLMVg2IKiHUNdxeoiSZBaszrHo9pPKVwO0lDRlEPE');
//         FB.api('/me/posts', 'get', function(result) {
//         var opts = {
//             'appId': '812881395467161',
//             'secret': '66168284ca9966a563f5b5e13a5a8e37',
//             'redirectUri': 'http://socialfeed.com:8000/auth/facebook/callback',
//             'scope': 'user_about_me, public_profile, user_posts, read_stream'

//         }
//         if (!result) {
//             return res.send(500, 'error');
//         } else if (result.error) {
//             if (result.error.type == 'OAuthException') {
//                 result.redirectUri = FB.getLoginUrl(opts);
//                 console.log('Redirect Url :' + result.redirectUri);
//             }
         
//         }

//         resolve(result)
//     });
//     })
// }
