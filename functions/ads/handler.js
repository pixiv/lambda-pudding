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
            // console.info('get_ads_ids', data);
            console.info('(done) get_ads_ids');
            if (data.Item.ids === undefined) { // no data
                context.done(null, []);
            }
            else {
                cb(data.Item.ids.values); // ids is a StringSet
            }
        }
    });
}

function put_new_place(place_id, context, cb) {
    let params = {
        TableName : 'counter',
        Item : {
            'place_id' : place_id,
            'impression' : 0,
            'ads' : {}
        },
        ReturnConsumedCapacity : 'TOTAL'
    };

    docClient.put(params, function(err, data) {
        if (err) {
            console.error('put_new_place', err);
            context.done(err, 'Error (put_new_place)');
        }
        else {
            // console.info('put_new_place', data);
            console.info('(done) put_new_place');
            cb();
        }
    });
}

function get_ads_counters(place_id, context, cb) {
    let params = {
        TableName : 'counter',
        Key : {
            'place_id' : place_id,
        },
        ReturnConsumedCapacity : 'TOTAL'
    };
    docClient.get(params, function(err, data) {
        if (err) {
            console.error('get_ads_counters', err);
            context.done(err, 'Error (get_ads_counters)');
        }
        else {
            // data has a map that contains ads ids and counters (impression/conversion)
            // e.g. ads : { "foo" : { "i" : 0, "c" : 0}, "bar": {...}}
            // console.info('get_ads_counters', data);
            console.info('(done) get_ads_counters');

            // a new place
            if (data.Item === undefined) {
                put_new_place(place_id, context, function() {
                    cb({});
                });
            }
            else {
                cb(data.Item.ads);
            }
        }
    });
}

// UCB1 bandit algorithm
function choose_ads(num, all_ads_ids, ads_counters, cb) {
    let total_imp = 0;
    let total_conv = 0;
    let items = [];

    for (const id of all_ads_ids) {
        let item = { 'id' : id };
        if (id in ads_counters) {
            const imp = ads_counters[id].i;
            const conv = ads_counters[id].c;
            total_imp += imp;
            total_conv += conv;
            item.value = conv / imp;
            item.bonus = Math.sqrt(1 / (2 * imp));
        }
        else {
            item.value = Infinity;
            item.bonus = Infinity;
        }
        items.push(item);
    }

    items.sort(function(a , b) {
        let score = function(item) { return item.value + item.bonus * Math.sqrt(total_imp) };
        const a_score = score(a);
        const b_score = score(b);
        if (a_score > b_score) return -1;
        if (a_score < b_score) return 1;
        return 0;
    });

    // choose top `num'
    cb(items.slice(0, num));
}

function create_insert_params(place_id, ads) {
    let params = {
        TableName : 'counter',
        Key : {
            'place_id' : place_id,
        },
        ExpressionAttributeValues : {
            ':map' : { 'i' : 0, 'c' : 0}
        },
        ReturnConsumedCapacity : 'TOTAL'
    }

    // increment the impression of the place
    let expression = 'set ';
    let attribute_names = {
        '#ads' : 'ads',
    };

    // insert not existing items
    let counter = 0;
    for (let ad of ads) {
        if (counter != 0) expression += ', ';
        // if it exists, just copy it
        expression += '#ads.#ads_id' + counter + ' = if_not_exists(#ads.#ads_id' + counter + ', :map)';
        attribute_names['#ads_id' + counter] = ad.id;
        counter++;
    }
    params.UpdateExpression = expression;
    params.ExpressionAttributeNames = attribute_names;
    return params;
}

function insert_not_exsiting_items(place_id, ads, context, cb) {
    let params = create_insert_params(place_id, ads);

    docClient.update(params, function(err, data) {
        if (err) {
            console.error('insert_not_exsiting_items', err);
            context.done(err, 'Error (insert_not_exsiting_items)');
        }
        else {
            // console.info('insert_not_exsiting_items', data);
            console.info('(done) insert_not_exsiting_items');
            cb();
        }
    });
}

function create_incremental_params(place_id, ads) {
    let params = {
        TableName : 'counter',
        Key : {
            'place_id' : place_id,
        },
        ExpressionAttributeValues : {
            ':one' : 1,
        },
        ReturnConsumedCapacity : 'TOTAL'
    }

    // increment the impression of the place
    let expression = 'set #impression = #impression + :one';
    let attribute_names = {
        '#ads' : 'ads',
        '#impression' : 'impression',
        '#imp' : 'i',
    };

    // increment the impression of each ad
    let counter = 0;
    for (let ad of ads) {
        expression += ', #ads.#ads_id' + counter + '.#imp'
                    + ' = #ads.#ads_id' + counter + '.#imp + :one';
        attribute_names['#ads_id' + counter] = ad.id;
        counter++;
    }
    params.UpdateExpression = expression;
    params.ExpressionAttributeNames = attribute_names;
    return params;
}

function increment_impressions(place_id, ads, context, cb) {
    let params = create_incremental_params(place_id, ads);

    docClient.update(params, function(err, data) {
        if (err) {
            console.error('increment_impressions', err);
            context.done(err, 'Error (increment_impressions)');
        }
        else {
            // console.info('increment_impressions', data);
            console.info('(done) increment_impressions');
            cb();
        }
    });
}

function get_ads_contents(ads, context, cb) {
    let keys = [];
    for (let a of ads) {
        keys.push({'ads_id' : a.id});
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
            // console.info('get_ads_contents', data);
            console.info('(done) get_ads_contents');
            cb(data.Responses.ads_contents);
        }
    });
}

module.exports.handler = function(event, context, cb) {
    console.log(event);
    if (event.place_id === undefined) {
        context.fail('invalid parameters');
        return ;
    }

    // read all ads ids
    get_ads_ids(context, function(all_ads_ids) {
        // read ads counters related to the place id
        get_ads_counters(event.place_id, context, function(ads_counters) {
            // choose 3 ads
            choose_ads(3, all_ads_ids, ads_counters, function(ads) {
                // insert not existing ads
                insert_not_exsiting_items(event.place_id, ads, context, function() {
                    // increment the impressions of chosen ads
                    increment_impressions(event.place_id, ads, context, function() {
                        get_ads_contents(ads, context, function(ads_contents) {
                            context.done(null, ads_contents);
                        });
                    });
                });
            });
        });
    });

};
