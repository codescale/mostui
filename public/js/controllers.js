'use strict';

/* Controllers */

function AppCtrl($scope, socket) {

    // Socket listeners
    // ================

    socket.on('init', function (data) {
        $scope.urls = data.urls;
    });

    socket.on('mongostat', function (url, message) {
        console.log(url);
        console.log(message);
        $scope.messages.push(message);
    });
}