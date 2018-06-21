const puppeteer = require('puppeteer');
const Promise = require('bluebird');
const _ = require('lodash');
const crypto = require('crypto');
const schedule = require('node-schedule');
const intel = require('intel');

const config = require('./config');

intel.config({
    formatters: {
        'simple': {
            'format': '[%(levelname)s] [%(name)s] %(message)s',
            'colorize': true
        },
        'details': {
            'format': '[%(date)s] %(name)s.%(levelname)s: %(message)s',
            'strip': true
        }
    },
    // filters: {
    //     'db': 'patrol.db'
    // },
    handlers: {
        'terminal': {
            'class': intel.handlers.Console,
            'formatter': 'simple',
            'level': intel.VERBOSE
        },
        'null': {
            'class': intel.handlers.Console,
            'formatter': 'simple',
            'level': intel.VERBOSE
        },
        // 'logfile': {
        //     'class': intel.handlers.File,
        //     'level': intel.WARN,
        //     'file': '/var/log/report.log',
        //     'formatter': 'details',
        //     'filters': ['db']
        // }
    },
    loggers: {
        'yamusic-crawler': {
            'handlers': ['terminal'],
            'level': intel .VERBOSE,
            'handleExceptions': true,
            'exitOnError': false,
            'propagate': false
        },
        'yamusic-crawler.node_modules.sequelize': {
            'handlers': ['terminal'],
            'level': intel.WARN
        },
        'yamusic-crawler.node_modules.puppeteer': {
            'handlers': ['terminal'],
            'level': intel.WARN
        }
    }
});
require('intel').console();

const Crawler = require('./crawler');
const Dashboard = require('./dashboard');
const TracksDb = require('./tracksdb')

let tracksdb = null;
let crawler = null;


async function syncTracklist() {
    let tracks = await crawler.grabTracks();
    await tracksdb.updateList(tracks);
}


async function init() {
    tracksdb = new TracksDb();
    crawler = new Crawler({
        tracksUrl: config.urls.ALL_TRACKS,
        loginUrl: config.urls.LOGIN,
        selectors: config.selector
    });

    await crawler.start();
    await tracksdb.init({ recreate: true });
    
    await syncTracklist();
}

init();


// (async () => {
//     const crawler = new Crawler({
//         tracksUrl: config.urls.ALL_TRACKS,
//         loginUrl: config.urls.LOGIN,
//         selectors: config.selector
//     });


//     let j = schedule.scheduleJob('*/2 * * * * *', () => {
//         console.log('2s task');
//     });
 
  
//   //await page.goto('https://music.yandex.ru');
  
//   //const loginBtn = await page.$('body > div.page-root.page-root_no-player > div.head > div.head__wrap > div.head__user > a');
//   /*
//   if(loginBtn) {
//       console.log('Not logged in');
//       await page.goto('https://passport.yandex.ru');
      
//       await page.type(
//         '#root > div > div.passport-Page-Content > div.passport-Domik > div > div > div > div > div > form > div > label > input[name="login"]',
//         ''
//       );      
//       await page.type(
//         '#root > div > div.passport-Page-Content > div.passport-Domik > div > div > div > div > div > form > div > label > input[name="passwd"]',
//         ''
//       );
      
//       await 

//       console.log('Login complete');
//   }
//   else {
//       console.log('Already logged in');
//   }
  
//   */
// })();

