const _ = require('lodash');
const Promise = require('bluebird');
const log = require('intel').getLogger('yamusic-crawler.tracksdb');
const Sequelize = require('sequelize');
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite'
});

const Track = sequelize.define('track', {
    id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
        unique: true
    },
    title: {
        type: Sequelize.STRING
    },
    trackRef: {
        type: Sequelize.STRING
    },
    album: {
        type: Sequelize.STRING
    },
    albumArt: {
        type: Sequelize.STRING
    },
    artist: {
        type: Sequelize.STRING
    },
    artistRef: {
        type: Sequelize.STRING
    },
    removed: {
        type: Sequelize.BOOLEAN, 
        allowNull: false, 
        defaultValue: false
    }
});



class TracksDb {
    constructor(options) {

    }

    async init(opts) {
        //await sequelize.sync({ force: _.get(opts, 'recreate', false)});
    }

    async updateList(tracklist) {
        try {
            let updatedIds = [];
            let removedIds = [];
            let addedIds = [];

            let newList = _.cloneDeep(tracklist);
            let oldList = await Track.findAll();

            if (_.size(oldList) > 0) {
                log.verbose(`There are ${_.size(oldList)} tracks in database already.`);
                await Promise.all(_.map(oldList, (track) => {
                    const currentId = track.get('id');
                    if (newList[currentId]) {
                        // Update
                        log.verbose(`Updating track ${track.get('title')} id:[${currentId}].`);
                        updatedIds.push(currentId);
                        return track.update(newList[currentId]);
                    }
                    else {
                        // Remove
                        log.verbose(`Mark 'removed' track ${track.get('title')} id:[ ${currentId} ].`);
                        removedIds.push(currentId);
                        return track.update({
                            removed: true
                        });
                    }
                }));
            }

            _.each(updatedIds, (id) => { delete newList[id]; });

            if (_.size(newList) > 0) {
                log.verbose(`There are ${_.size(newList)} tracks to add to database.`);
                await Promise.all(_.map(newList, (track) => {
                    log.verbose(`Add track ${track.title} id:[ ${track.id} ].`);
                    addedIds.push(track.id);
                    return Track.create(track);
                }));
            }

            if (_.size(addedIds) && _.size(oldList) > 0) {
                // Emit added
            }
            if (_.size(updatedIds)) {
                // Emit updated
            }
            if (_.size(removedIds)) {
                // Emit removed
            }
            return Promise.resolve();
        }
        catch(e) {
            log.error('Error when updating tracks!', e);
            throw e;
        }
    }
}

module.exports = TracksDb;
module.exports.TrackModel = Track;
