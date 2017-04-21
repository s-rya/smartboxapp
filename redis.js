/**
 * Created by iSmile on 4/3/2017.
 */
'use strict';
const redis = require('redis');
const config = require('./config/config');
const rC = redis.createClient(config.redis);

/*
* This method saves the key value pair in Redis
* @param key {String}
* @param value {Object|String}
* */
const set = (key, value) => {
    return new Promise((resolve, reject) => {
        //Stringify objects into strings before storing.
        rC.set(key, JSON.stringify(value), (err, reply) => {
            if (err) {
                reject(err);
            } else {
                resolve(value);
            }
        });
    });
};

/*
 * This method retrieves the value based on the key
 * @param key {String}
 * */
const get = key  => {
    return new Promise((resolve, reject) => {
        rC.get(key, (err, reply) => {
            if (err) {
                reject(err);
            } else {
                //Parse the stringified content back into object(or text), so that developer need not do everytime
                resolve(JSON.parse(reply)); //Reply is null if there is no key found.
            }
        });
    });
};

module.exports = {
    set: set,
    get: get
};
