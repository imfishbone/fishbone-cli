'use strict';

const log = require('npmlog');
log.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info';
log.heading = 'fishbone';
log.addLevel('success', 2000, { fg: 'green', bg: 'red', blod: true });

module.exports = log;

