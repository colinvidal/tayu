'use strict';

let users = [];
let actionList = [];

exports.join = function(userWS) {
    users.push(userWS);
    userWS.send(JSON.stringify(actionList));
}

exports.leave = function(userWS) {
    users = users.filter(user => user !== userWS);
}

exports.action = function(userWS, action) {
    if (action.type === 'NEW_GAME') {
        actionList = [];
    }

    actionList.push(action);
    users.filter(user => user !== userWS).forEach(user => user.send(JSON.stringify([action])));
}