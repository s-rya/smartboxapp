/**
 * Created by s_rya on 2/13/2017.
 */
'use strict';
//Config values for Redis cache
const redis = {
    url : 'redis://admin:OOQJXRSAFFKVXMMQ@bluemix-sandbox-dal-9-portal.7.dblayer.com:25114'
};

const smartboxserviceURL = 'https://smart-dev.mybluemix.net/';
const smartboxServiceWS = 'wss://smart-dev.mybluemix.net';
const webSearchURL = 'https://www.google.com/search?q=';

module.exports = {
    redis: redis,
    smartboxserviceURL: smartboxserviceURL,
    smartboxServiceWS: smartboxServiceWS,
    webSearchURL: webSearchURL
};