const crypto = require('crypto');

const md5FromString = (string) => {
    return crypto.createHash('md5').update(string).digest("hex");
}

const generateTrackId = (track) => {
    if (!track.trackRef) throw new Error('Can not generate track id');
    return md5FromString(track.trackRef);
}

module.exports.md5FromString = md5FromString;
module.exports.generateTrackId = generateTrackId;
