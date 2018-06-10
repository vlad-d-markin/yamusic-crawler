const intel = require('intel');


module.exports = {
    HEADLESS: false,
    
    viewport: {
        WIDTH: 1200,
        HEIGHT: 700
    },
    
    urls: {
        ROOT: '',
        ALL_TRACKS: 'https://music.yandex.ru/users/vlad.d.markin/tracks',
        LOGIN: 'https://passport.yandex.ru'
    },
    
    selector: {
        TRACK_ROW: 'div.page-users__tracks > div.longlist_tracks > div.longlist__cont > div.d-track',
        TRACK_ROW_TITLE: 'div.d-track__name > a',
        TRACK_ROW_ALBUM: '.d-track__artists > a',
        FOOTER: 'div.footer',
        ALL_TRACKS_BTN: 'div.centerblock-wrapper > div.centerblock > div > div > div.page-users__subhead > div.like-filter__right-side > nav > button.like-filter__all',
        LOGIN_INPUT: '#root > div > div.passport-Page-Content > div.passport-Domik > input[name="login"]',
        PASSWORD_INPUT: '#root > div > div.passport-Page-Content > div.passport-Domik > input[name="passwd"]',
        LOGIN_SUBMIT: '#root > div > div.passport-Page-Content > div.passport-Domik > button.passport-Button[type="submit"]'
    }
};

// intel.config({

// });
