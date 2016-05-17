'use strict';

let AWS = require('aws-sdk');
let docClient = new AWS.DynamoDB.DocumentClient({region : 'ap-northeast-1'});

function delete_place(place_id, context, cb) {
    let params = {
        TableName : 'counter',
        Key : {
            'place_id' : place_id
        },
        ReturnConsumedCapacity : 'TOTAL'
    };

    docClient.delete(params, function(err, data) {
        if (err) {
            console.error('delete_place', err);
            context.done(err, 'Error (delete_place)');
        }
        else {
            console.info('delete_place', data);
            cb();
        }
    });
}


module.exports.handler = function(event, context, cb) {
    if (event.place_id === undefined) {
        context.done('place_id is undefined', null);
        return ;
    }

    delete_place(decodeURIComponent(event.place_id), context, function() {
        context.done(null, 'OK');
    });
};
