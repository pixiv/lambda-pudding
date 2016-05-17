'use strict';

let AWS = require('aws-sdk');
let docClient = new AWS.DynamoDB.DocumentClient({region : 'ap-northeast-1'});

function put_new_place(place_id, context, cb) {
    let params = {
        TableName : 'counter',
        Item : {
            'place_id' : place_id,
            'impression' : 0,
            'ads' : {}
        },
        Expected : {
            'impression' : {'Exists' : false},
            'ads' : {'Exists' : false}
        },
        ReturnConsumedCapacity : 'TOTAL'
    };

    docClient.put(params, function(err, data) {
        if (err) {
            console.error('put_new_place', err);
            context.done(err, 'Error (put_new_place)');
        }
        else {
            console.info('put_new_place', data);
            cb();
        }
    });
}

module.exports.handler = function(event, context, cb) {
    put_new_place(decodeURIComponent(event.place_id), context, function() {
        context.done(null, "OK");
    });
};
