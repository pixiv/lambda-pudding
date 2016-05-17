'use strict';

let AWS = require('aws-sdk');
let docClient = new AWS.DynamoDB.DocumentClient({region : 'ap-northeast-1'});

function get_ads_ids(context, cb) {
    let params = {
        TableName : 'ads_ids',
        Key : {
            'dummy' : 0,
        },
        ReturnConsumedCapacity : 'TOTAL'
    };

    docClient.get(params, function(err, data) {
        if (err) {
            console.error('get_ads_ids', err);
            context.done(err, 'Error (get_ads_ids)');
        }
        else {
            // data has a list that contains ads ids
            console.info('get_ads_ids', data);
            cb(data.Item.ids.values);
        }
    });
}

function get_ads_contents(ads_ids, context, cb) {
    let keys = [];
    for (let id of ads_ids) {
        keys.push({'ads_id' : id});
    }
    let params = {
        RequestItems : {
            'ads_contents' : {
                Keys : keys
            }
        },
        ReturnConsumedCapacity : 'TOTAL'
    };

    docClient.batchGet(params, function(err, data) {
        if (err) {
            console.error('get_ads_contents', err);
            context.done(err, 'Error (get_ads_contents)');
        }
        else {
            // data has a list that contains ads contents
            console.info('get_ads_contents', data);
            cb(data.Responses.ads_contents);
        }
    });
}

module.exports.handler = function(event, context, cb) {
    get_ads_ids(context, function(all_ads_ids) {
        get_ads_contents(all_ads_ids, context, function(ads_contents) {
            context.done(null, ads_contents);
        });
    });
};
