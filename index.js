const puppeteer = require('puppeteer');
const Promise = require('bluebird');
const _ = require('lodash');
const crypto = require('crypto');

const config = require('./config');


const Crawler = require('./crawler');


function md5FromString(string) {
    return crypto.createHash('md5').update(string).digest("hex");
}


function generateTrackId(track) {
    return md5FromString(track.trackRef);
}


async function scrapeTracks(page) {
    let tracks = {};
    let tracksRaw = await page.evaluate(function(config) {
        const extractedElements = document.querySelectorAll(config.selector.TRACK_ROW);
        const items = [];
        for (let element of extractedElements) {
            let titleEl = element.querySelector(config.selector.TRACK_ROW_TITLE);
            let artistEl = element.querySelector(config.selector.TRACK_ROW_ARTIST);
            if (!titleEl || !artistEl) continue;
            items.push({ 
                title: titleEl.innerText, 
                trackRef: titleEl.getAttribute('href'),
                artist: artistEl.innerText,
                artistRef: artistEl.getAttribute('href')
            });
        }
        return items;
    }, config);

    for (let track of tracksRaw) {
        let trackId = generateTrackId(track);
        tracks[trackId] = track;
        tracks[trackId].id = trackId;
    }
    return Promise.resolve(tracks);
}


async function scrollPageTopToBottomAndScrape(page, scrape) {
    let scrapeResults = {};
    console.log('Scrolling page...');
    await page.evaluate('window.scrollTo(0, 0)');
    while (true) {        
        let footerReached = await page.$eval(config.selector.FOOTER, function (elem){
            var $elem = $(elem);
            var $window = $(window);

            var docViewTop = $window.scrollTop();
            var docViewBottom = docViewTop + $window.height();

            var elemTop = $elem.offset().top;
            var elemBottom = elemTop + $elem.height();

            return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
        });
        if (footerReached) break;
        if (scrape) {
            let result = await scrape(page);
            _.merge(scrapeResults, result);
        }
        await page.evaluate('window.scrollBy(0, 80)');
        await page.waitFor(80);
    }
    console.log('Scrolling page... Done!');
    return Promise.resolve(scrapeResults);
}



async function passportLogin(page, login, password) {
    await page.goto(config.urls.LOGIN);
    await page.type(config.selector.LOGIN_INPUT, login);
    await page.type(config.selector.PASSWORD_INPUT, password);
    return Promise.all([
        page.click(config.selector.LOGIN_SUBMIT),
        await page.waitForNavigation()
    ]);
}


(async () => {
    const crawler = new Crawler({
        tracksUrl: config.urls.ALL_TRACKS,
        selectors: config.selector
    });

    await crawler.start();
    await crawler.watch();

    return;
    const browser = await puppeteer.launch({ headless: config.HEADLESS });
    const page = await browser.newPage();
  
    await page.setViewport({ width: config.viewport.WIDTH, height: config.viewport.HEIGHT });
    page.on('console', msg => {
        console.log(`Browser >> ${msg.text()}`);
    });
  
  //await page.goto('https://music.yandex.ru');
  
  //const loginBtn = await page.$('body > div.page-root.page-root_no-player > div.head > div.head__wrap > div.head__user > a');
  /*
  if(loginBtn) {
      console.log('Not logged in');
      await page.goto('https://passport.yandex.ru');
      
      await page.type(
        '#root > div > div.passport-Page-Content > div.passport-Domik > div > div > div > div > div > form > div > label > input[name="login"]',
        ''
      );      
      await page.type(
        '#root > div > div.passport-Page-Content > div.passport-Domik > div > div > div > div > div > form > div > label > input[name="passwd"]',
        ''
      );
      
      await 

      console.log('Login complete');
  }
  else {
      console.log('Already logged in');
  }
  
  */
  

    try {
        await page.goto('https://music.yandex.ru/users/vlad.d.markin/tracks');
        await page.click(config.selector.ALL_TRACKS_BTN);
        await page.waitFor(2000);

        let tracks = await scrollPageTopToBottomAndScrape(page, scrapeTracks);
        //console.log(tracks);
  }
  catch (e) {
      console.error(e);
  }
})();

