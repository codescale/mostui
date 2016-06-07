'use strict';

// Declare app level module which depends on filters, and services
var mostui = {};
mostui.app = angular.module('myApp', [
  'ngRoute',

  'myApp.controllers',
  'myApp.services'
]).
config(function ($routeProvider, $locationProvider) {
  $routeProvider.
  when('/', {
    templateUrl: 'partials/serverManager',
    controller: 'MyCtrl2'
  }).
  otherwise({
    redirectTo: '/'
  });

  $locationProvider.html5Mode(true);
});