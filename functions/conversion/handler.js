'use strict';

let AWS = require('aws-sdk');
let docClient = new AWS.DynamoDB.DocumentClient({region : 'ap-northeast-1'});

function increment_conversion(place_id, ads_id, context, cb) {
    let params = {
        TableName : 'counter',
        Key : {
            'place_id' : place_id,
        },
        UpdateExpression : 'set #ads.#ads_id.#conversion = #ads.#ads_id.#conversion + :one',
        ExpressionAttributeNames : {
            '#ads' : 'ads',
            '#ads_id' : ads_id,
            '#conversion' : 'c'
        },
        ExpressionAttributeValues : { ':one' : 1 },
        ReturnConsumedCapacity : 'TOTAL'
    };
    console.log('increment_conversion', params);

    docClient.update(params, function(err, data) {
        if (err) {
            console.error('increment_conversion', err);
            context.done(err, 'Error (increment_conversion)');
        }
        else {
            console.info('(done) increment_conversion');
            cb();
        }
    });
}

module.exports.handler = function(event, context, cb) {
    let place_id = '';
    let ads_id = '';

    if (event.httpMethod === 'GET') {
        if (event.place_id === undefined
                || event.ads_id === undefined) {
            context.done('invalid parameters', null);
            return ;
        }
        place_id = event.place_id;
        ads_id = event.ads_id;
    }
    else /* if (event.httpMethod === 'POST') */ {
        if (event.body === undefined
                || event.body.place_id === undefined
                || event.body.ads_id === undefined) {
            context.done('invalid parameters', null);
            return ;
        }
        place_id = event.body.place_id;
        ads_id = event.body.ads_id;
    }

    increment_conversion(place_id, ads_id, context, function() {
        context.done(null, 'OK');
    });
};
