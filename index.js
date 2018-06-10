const puppeteer = require('puppeteer');
const Promise = require('bluebird');
const _ = require('lodash');
const crypto = require('crypto');

const config = require('./config');


const Crawler = require('./crawler');




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
})();

