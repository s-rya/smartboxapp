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


app.controller('popupSearch', ['$scope', '$sce', '$timeout', '$rootScope','$http', function ($scope, $sce, $timeout, $rootScope, $http) {
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
                        '<p><b>' + r['Item Name'] + '</b> - '+ r.score +'</p><p style="font-size: 11px;">' + r['Documentation with HTML'] + '</p><div style="display: none" id="block'+i+'feedback">' +
                        '<img id="upImage-'+i+'" value="false" email="'+user.email+'" appName="'+r.metadata.applicationName+'" answerId="'+r.id+'" keyword="'+$rootScope.result.keyword + '" question="'+$rootScope.redisData.question + ' in ' + $rootScope.redisData.appName.split('+')[0]+'" style="float: left; border-radius:20px;" onclick="thumbsUp(this)" src="https://cdn2.iconfinder.com/data/icons/social-productivity-line-art-1/128/face-happy-48.png" height="30px;" width="30px;">' +
                        '<img id="downImage-'+i+'" value="false" email="'+user.email+'" appName="'+r.metadata.applicationName+'" answerId="'+r.id+'" keyword="'+$rootScope.result.keyword + '" question="'+$rootScope.redisData.question + ' in ' + $rootScope.redisData.appName.split('+')[0]+'" style="float: right; border-radius:20px;" onclick="thumbsDown(this)" src="https://cdn2.iconfinder.com/data/icons/social-productivity-line-art-1/128/face-sad-48.png" height="30px;" width="30px;">' +
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


    $scope.appName = "rephrase+Rephrase your question";
    $scope.showApplicationList = function(){
        $http({
            method:"GET",
            url: "https://844d8c57-58b6-4391-8b52-50492bc81db2-bluemix.cloudant.com/discovery-collection/b92685acb07f94e969aa1a10460e1e36",
            headers: {  "Authorization": "Basic ODQ0ZDhjNTctNThiNi00MzkxLThiNTItNTA0OTJiYzgxZGIyLWJsdWVtaXg6YWNiYjBkNGM4YzVhMjUxZGIwNjBkMzg5MGZjOTI5YWZiYjczMmM4MGZmN2FmOTQ4ZGI1ZDRkYjUxMmYzMjdlYQ=="  }
        }).then(result => {
            $scope.appListNames = [];
            console.log(result);
            $scope.appListNames = result.data.appList;
            $scope.appListNames.push({name:"Rephrase your question", shortName:"rephrase"});
            $scope.appListNames.push({name:"None of the above", shortName:"noneOfTheAbove"});
            $scope.parentDisableStyle = { display: "block" };
            $scope.didntAnswerStyle = { display: "block" };
            $scope.content0Style = { display: "block" };
            $scope.content1Style = { display: "none" };
        })
    };

}]);

