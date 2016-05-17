'use strict';

let doc = require('dynamodb-doc');
let dynamo = new doc.DynamoDB();

module.exports.handler = function(event, context, cb) {
    var k = 1;
    var params = {
        TableName: 'test-table',
        Key: {
            "place_id" : event.place_id,
            "ads_id" : k.toString(),
        },
        UpdateExpression: 'set #count = #count + :i',
        ExpressionAttributeNames: {'#count': 'impression'},
        ExpressionAttributeValues: {':i': 1}
    };

    dynamo.updateItem(params, function (err, data) {
        if (err) {
            context.fail("err" + err, data);
        }
        else {
            context.done(null, data);
        }
    });
};
