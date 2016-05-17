'use strict';

let AWS = require('aws-sdk');
let docClient = new AWS.DynamoDB.DocumentClient({region : 'ap-northeast-1'});

function delete_ads(ads_id, context, cb) {
    let params = {
        TableName : 'ads_ids',
        Key : {
            'dummy' : 0
        },
        UpdateExpression : 'delete #ids :ads_id',
        ExpressionAttributeNames : {
            '#ids' : 'ids'
        },
        ExpressionAttributeValues : {
            ':ads_id' : docClient.createSet([ads_id])
        },
        ReturnConsumedCapacity : 'TOTAL'
    };

    docClient.update(params, function(err, data) {
        if (err) {
            console.error('delete_ads', err);
            context.done(err, 'Error (delete_ads)');
        }
        else {
            console.info('delete_ads', data);
            cb();
        }
    });
}

module.exports.handler = function(event, context, cb) {
    if (event.ads_id === undefined) {
        context.done('ads_id is undefined', null);
        return ;
    }

    delete_ads(decodeURIComponent(event.ads_id), context, function() {
        context.done(null, 'OK');
    });
};
