const puppeteer = require('puppeteer');
const Promise = require('bluebird');
const _ = require('lodash');
const utils = require('./utils');
const EventEmitter = require('events');
const log = require('intel').getLogger('yamusic-crawler.crawler');
const browserLog = require('intel').getLogger('yamusic-crawler.crawler.browser');


class Crawler extends EventEmitter {
    constructor(options) {
        super(options);
        this._opts = {
            headless: _.get(options, 'headless', false),
            width: _.get(options, 'width', 1200),
            height: _.get(options, 'height', 700),
            tracksUrl: _.get(options, 'tracksUrl'),
            loginUrl: _.get(options, 'loginUrl'),
            selectors: _.get(options, 'selectors'),
            pollTimeout: _.get(options, 'pollTimeout', 2000)
        };

        this.browser = null;
        this.page = null;        
    }

    async start() {
        try {
            this.browser = await puppeteer.launch(this._opts);
            this.page = await this.browser.newPage();
            await this.page.setViewport(this._opts);
            log.info('Browser was launched successfully');
        }
        catch (e) {
            log.error('Browser launch failed');
            this.emit('error', e);
            return Promise.reject(e);
        }

        this.browser.on('disconnected', () => {
            log.info('Browser disconnected');
            this.emit('browser.disconnected');
        });
        this.page.on('console', msg => {
            this.emit('browser.console', msg);
            browserLog.info(`${msg.text()}`);
        });

        return Promise.resolve();
    }

    async stop() {
        try {
            await this.browser.close();
            log.info('Browser closed');
            this.browser.removeAllListeners('disconnected');
            this.page.removeAllListeners('console')
            return Promise.resolve();
        }
        catch (e) {
            log.error('Failed to close browser');
            return Promise.reject(e);
        }
    }

    async login(getCredentials) {
        try {
            await this.page.goto(this._opts.loginUrl);
            const { login, password } = await getCredentials();
            await this.page.type(this._opts.selectors.LOGIN_INPUT, login);
            await this.page.type(this._opts.selectors.PASSWORD_INPUT, password);
            await this.page.click(this._opts.selectors.LOGIN_SUBMIT);
            await this.page.waitFor(3000);
            let avatar = await this.page.$('.avatar');
            if (avatar) {
                return Promise.resolve();
            }
            throw new Error('Bad login');
        }
        catch(e) {
            log.error('Error while login', e);
            return Promise.reject(e);
        }
    }

    async grabTracks(all) {
        try {
            if (this.page.url() != this._opts.tracksUrl) {
                await this.page.goto(this._opts.tracksUrl);
            }
            else { 
                await this.page.reload();
            }
            if (all) {
                await this.page.click(this._opts.selectors.ALL_TRACKS_BTN);
            }
            await this.page.waitFor(2000);
            let result = await this._scrollPageTopToBottomAndScrape();
            return Promise.resolve(result);
        }
        catch(e) {
            log.error('Error while grabbing tracks');
            return Promise.reject(e);
        }  
    }

    async _scrapeTracks() {
        let tracks = {};
        let tracksRaw = await this.page.evaluate(function (opts) {
            var extractedElements = document.querySelectorAll(opts.selectors.TRACK_ROW);
            var items = [];
            for (var element of extractedElements) {
                var titleEl = element.querySelector(opts.selectors.TRACK_ROW_TITLE);
                var artistEl = element.querySelector(opts.selectors.TRACK_ROW_ARTIST);
                if (titleEl) {
                    items.push({
                        title: titleEl.innerText,
                        trackRef: titleEl.getAttribute('href'),
                        artist: artistEl.innerText,
                        artistRef: artistEl.getAttribute('href')
                    });
                }
            }
            return items;
        }, this._opts);

        for (let track of tracksRaw) {
            let trackId = utils.generateTrackId(track);
            tracks[trackId] = track;
            tracks[trackId].id = trackId;
        }

        return Promise.resolve(tracks);
    }

    async _scrollPageTopToBottomAndScrape() {
        let scrapedTracks = {};
        log.verbose('Scrolling page...');
        await this.page.evaluate('window.scrollTo(0, 0)');
        while (true) {
            let footerReached = await this.page.$eval(this._opts.selectors.FOOTER, function (elem) {
                var $elem = $(elem);
                var $window = $(window);
                var docViewTop = $window.scrollTop();
                var docViewBottom = docViewTop + $window.height();
                var elemTop = $elem.offset().top;
                var elemBottom = elemTop + $elem.height();
                return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
            });
            if (footerReached) break;

            let result = await this._scrapeTracks();
            _.merge(scrapedTracks, result);

            await this.page.evaluate('window.scrollBy(0, 80)');
            await this.page.waitFor(80);
        }
        log.verbose('Scrolling page... Done!');
        return Promise.resolve(scrapedTracks);
    }
}

module.exports = Crawler;
