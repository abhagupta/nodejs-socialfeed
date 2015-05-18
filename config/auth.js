module.exports = {
  'development':{
    'facebookAuth': {
        consumerKey: '812881395467161',
        consumerSecret: '66168284ca9966a563f5b5e13a5a8e37',
        callbackURL: 'http://socialfeed.com:8000/auth/facebook/callback'
    },
    'googleAuth': {
        'consumerKey': '43531689224-uh9pla3j7vhflsaaabk5gmhi8fb06nto.apps.googleusercontent.com',
        'consumerSecret': 'OtgBEVxFj6u8yv8b3vZzYlK5',
        'callbackUrl': 'http://socialfeed.com:8000/oauth2callback'
    },
    'twitterAuth': {
        'consumerKey': 'Toec1vkScZLwOR7H2vH3or7ls',
        'consumerSecret': 'FeLlhlT0qVHvmcExozednLdKyuoEoTkohcGIsIczDKhwKV0AND',
        'callbackUrl': 'http://socialfeed.com:8000/'
    }
  }
}
