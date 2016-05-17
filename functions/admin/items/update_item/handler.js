'use strict';

let AWS = require('aws-sdk');
let docClient = new AWS.DynamoDB.DocumentClient({region : 'ap-northeast-1'});

function put_new_ads_id(ads_id, context, cb) {
    let params = {
        TableName : 'ads_ids',
        Key : {
            'dummy' : 0
        },
        UpdateExpression : 'add #ids :ads_id',
        ExpressionAttributeNames : {
            '#ids' : 'ids'
        },
        ExpressionAttributeValues : {
            ':ads_id': docClient.createSet(ads_id)
        },
        ReturnConsumedCapacity : 'TOTAL'
    };

    docClient.update(params, function(err, data) {
        if (err) {
            console.error('put_new_ads_id', err);
            context.done(err, 'Error (put_new_ads_id)');
        }
        else {
            console.info('put_new_ads_id', data);
            cb();
        }
    });
}

function put_new_ads_info(ads_id, ads_info, context, cb) {
    ads_info.ads_id = ads_id;
    console.log(ads_info);

    let params = {
        TableName : 'ads_contents',
        Item : ads_info,
        ReturnConsumedCapacity : 'TOTAL'
    };

    docClient.put(params, function(err, data) {
        if (err) {
            console.error('put_new_ads_info', err);
            context.done(err, 'Error (put_new_ads_info)');
        }
        else {
            console.info('put_new_ads_info', data);
            cb();
        }
    });
}

module.exports.handler = function(event, context, cb) {
    console.log(event);
    if (event.body === undefined) {
        context.done('invalid parameters');
        return ;
    }
    const ads_id = decodeURIComponent(event.ads_id);
    put_new_ads_id(ads_id, context, function() {
        put_new_ads_info(ads_id, event.body.ads_info, context, function() {
            context.done(null, 'OK');
        });
    });
};
