/**
 * Created by iSmile on 4/20/2017.
 */
const app = angular.module('popupSearchApp', ['ngSanitize']);
const ipcr = require("electron").ipcRenderer;
const fs = require('fs');
const rp = require('request-promise');
const redis = require('./../redis');
const config = require('./../config/config');
const user = require('./../user.json');
//const user = require('../../../user.json');
app.directive('loading', function () {
    return {
        restrict: 'E',
        replace: true,
        template: '<div id="loading-wrapper"><div id="loading-text">LOADING</div><div id="loading-content"></div></div>',
        link: function (scope, element, attr) {
            scope.$watch('isLoading', function (val) {
                console.log(val);
                if (val)
                    $(element).show();
                else
                    $(element).hide();
            });
        }
    }
});

app.run(function ($rootScope) {

    redis.get('newSearch-'+user.email)
        .then(data => {
            $rootScope.redisData = data;
            var options = {
                method: 'POST',
                uri: config.smartboxserviceURL + 'discovery',
                body: {
                    "question": data.question + ' in ' + data.appName.split('+')[0],
                    "email": user.email,
                    "appName" : data.appName.split('+')[1]
                },
                json: true
            };
            return rp(options);

        }).then(res => {
            console.log(res);
            $rootScope.result = res;
            $rootScope.$broadcast('API-loaded');
        });

});


app.controller('popupSearch', ['$scope', '$sce', '$timeout', '$rootScope', function ($scope, $sce, $timeout, $rootScope) {
    $scope.snippet = [];
    $scope.isLoading = true;
    $scope.$on('API-loaded', function () {
        $scope.newQuestion = $rootScope.redisData.question + ' in ' + $rootScope.redisData.appName.split('+')[0];
        $scope.isLoading = true;
        $timeout(function () {
            $scope.isLoading = false;
            if($rootScope.result.result && $rootScope.result.count){
                $rootScope.result.result.forEach((r, i) => {
                    console.log('#######',r.metadata, r.up);
                    $scope.snippet.push(
                        '<p><b>' + r['Item Name'] + '</b></p><p style="font-size: 11px;">' + r['Documentation with HTML'] + '</p><div style="display: none" id="block'+i+'feedback">' +
                        '<img id="upImage-'+i+'" value="false" answerId="'+r.id+'" question="'+$rootScope.redisData.question + ' in ' + $rootScope.redisData.appName.split('+')[0]+'" style="float: left; border-radius:20px;" onclick="thumbsUp(this)" src="https://cdn2.iconfinder.com/data/icons/social-productivity-line-art-1/128/face-happy-48.png" height="30px;" width="30px;">' +
                        '<img id="downImage-'+i+'" value="false" answerId="'+r.id+'" question="'+$rootScope.redisData.question + ' in ' + $rootScope.redisData.appName.split('+')[0]+'" style="float: right; border-radius:20px;" onclick="thumbsDown(this)" src="https://cdn2.iconfinder.com/data/icons/social-productivity-line-art-1/128/face-sad-48.png" height="30px;" width="30px;">' +
                        '</div>');
                });
            } else {
                $scope.noResultMessage = {
                    display: 'block'
                };
                $scope.lookingFor = {
                    display: 'none'
                };
            }
        });
    });

    $scope.sendSearchData = function(){
        ipcr.send("popup-search",this.appName,$rootScope.redisData.question)
    };

    $scope.clean = function (c) {
        return $sce.trustAsHtml(c);
    };
}]);

