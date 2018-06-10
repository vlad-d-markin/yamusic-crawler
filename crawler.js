const puppeteer = require('puppeteer');
const Promise = require('bluebird');
const _ = require('lodash');
const crypto = require('crypto');
const EventEmitter = require('events');
const log = require('intel').getLogger('app.crawler');


function md5FromString(string) {
    return crypto.createHash('md5').update(string).digest("hex");
}


function generateTrackId(track) {
    return md5FromString(track.trackRef);
}



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

        this.watchInterval = null;
        this.isWatching = false;

        this._watchdog = () => {
            this.emit('pollstart');
            this._scrollPageTopToBottomAndScrape().then(() => {
                this.emit('pollfinish');
            });            
        };

        this.on('pollfinish', () => {
            log.verbose('Poll finished');
            if (this.isWatching) {
                log.verbose(`Next poll scheduled in ${this._opts.pollTimeout}ms`);
                this.watchInterval = setTimeout(this._watchdog, this._opts.pollTimeout);
            }
        });

        this.tracks = {};

        this._scrapeTracks = async () => {
            let tracks = {};
            let tracksRaw = await this.page.evaluate(function (opts) {
                const extractedElements = document.querySelectorAll(opts.selectors.TRACK_ROW);
                const items = [];
                for (let element of extractedElements) {
                    let titleEl = element.querySelector(opts.selectors.TRACK_ROW_TITLE);
                    let artistEl = element.querySelector(opts.selectors.TRACK_ROW_ARTIST);
                    if (!titleEl || !artistEl) continue;
                    items.push({
                        title: titleEl.innerText,
                        trackRef: titleEl.getAttribute('href'),
                        artist: artistEl.innerText,
                        artistRef: artistEl.getAttribute('href')
                    });
                }
                return items;
            }, this._opts);

            for (let track of tracksRaw) {
                let trackId = generateTrackId(track);
                tracks[trackId] = track;
                tracks[trackId].id = trackId;
            }
            return Promise.resolve(tracks);
        };

        this._scrollPageTopToBottomAndScrape = async () => {
            let scrapeResults = {};
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
                _.merge(this.tracks, result);

                await this.page.evaluate('window.scrollBy(0, 80)');
                await this.page.waitFor(80);
            }
            log.verbose('Scrolling page... Done!');
            return Promise.resolve(this.tracks);
        };
    }

    async start() {
        this.browser = await puppeteer.launch(this._opts);
        this.page = await this.browser.newPage();
        await this.page.setViewport(this._opts);
        log.info('Browser launched');

        this.browser.on('disconnected', () => {
            log.info('Browser disconnected');
            this.emit('browser.disconnected');
            this.stopWatch();
        });

        return Promise.resolve();
    }

    async stop() {

    }

    async watch() {
        this.isWatching = true;
        await this.page.goto(this._opts.tracksUrl);
        this._watchdog();
        return Promise.resolve();
    }

    async stopWatch() {
        this.isWatching = false;
        if (this.watchInterval) clearInterval(this.watchInterval);
        return Promise.resolve();
    }


    
}

module.exports = Crawler;
