'use strict';

let AWS = require('aws-sdk');
let docClient = new AWS.DynamoDB.DocumentClient({region : 'ap-northeast-1'});

function get_ads_content(ads_id, context, cb) {
    let params = {
        TableName : 'ads_contents',
        Key : {
            'ads_id': ads_id
        },
        ReturnConsumedCapacity : 'TOTAL'
    };

    docClient.get(params, function(err, data) {
        if (err) {
            console.error('get_ads_content', err);
            context.done(err, 'Error (get_ads_content)');
        }
        else {
            console.info('get_ads_content', data);
            cb(data.Item);
        }
    });
}

module.exports.handler = function(event, context, cb) {
    get_ads_content(decodeURIComponent(event.ads_id), context, function(ads_content) {
        context.done(null, ads_content);
    });
};
