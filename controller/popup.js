/**
 * Created by iSmile on 4/20/2017.
 */
const app = angular.module('popupSearchApp', ['ngSanitize']);
const ipcr = require("electron").ipcRenderer;
const fs = require('fs');
const rp = require('request-promise');
const config = require('./../config/config');
const user = require('./../user.json');
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

    ipcr.send('getSearchTerm');
    ipcr.on('search-term', (e, searchTerm, type) => {
        console.log('TYPEEEEEEEEEEE', type);

        switch (type){
            case 'discovery':
                $rootScope.result = searchTerm;
                $rootScope.redisData = {
                    question: searchTerm.question
                };
                $rootScope.$broadcast('API-loaded', 'discovery');
                break;
            case 'cloudant':
                $rootScope.result = searchTerm;
                $rootScope.$broadcast('API-loaded', 'cloudant');
                break;
            default:
                searchTerm.forEach(term => {
                    if (term.name === 'newSearch') {
                        let data = JSON.parse(term.value);
                        $rootScope.redisData = data;
                        var options = {
                            method: 'POST',
                            uri: config.smartboxserviceURL + 'discovery',
                            body: {
                                "question": data.question + ' in ' + data.appName.split('+')[0],
                                "email": user.email,
                                "appName": data.appName.split('+')[1]
                            },
                            json: true
                        };
                        rp(options).then(res => {
                            console.log(res);
                            $rootScope.result = res;
                            $rootScope.$broadcast('API-loaded', 'appListSearch');
                        });
                    }
                });

        }
    });
});


app.controller('popupSearch', ['$scope', '$sce', '$timeout', '$rootScope', '$http', function ($scope, $sce, $timeout, $rootScope, $http) {
    $scope.snippet = [];
    $scope.isLoading = true;
    $scope.isCloudantData = false;
    $scope.$on('API-loaded', function (event, type) {
        console.log('XXXXXXXXXXXXXXXX', type);
        if(type !== 'cloudant'){
            $scope.newQuestion = $rootScope.redisData.question;
            if(type === 'appListSearch') {
                $scope.newQuestion +=  ' in ' + $rootScope.redisData.appName.split('+')[0];
            }
            $scope.isLoading = true;
            $timeout(function () {
                $scope.isLoading = false;
                $scope.isCloudantData = false;
                if ($rootScope.result.result && $rootScope.result.count) {
                    $rootScope.result.result.forEach((r, i) => {
                        let appName = '';
                        console.log('#######', r.metadata, r.up);
                        if (!r.metadata) r.metadata = {};
                        if(r.metadata && r.metadata.applicationName) appName = `${r.metadata.applicationName} - `;
                        if(r['Documentation with HTML'].trim()) {
                            $scope.snippet.push(
                                '<p><b>' + appName + escapeSpecialCharacters(r['Item Name']) + '</b> - <span style="color: #95d13c;"><b>' + r.score + '</b><span></p><p style="font-size: 11px;">' + escapeSpecialCharacters(r['Documentation with HTML']) + '</p><div style="display: none" id="block' + i + 'feedback">' +
                                '<img id="upImage-' + i + '" value="false" email="' + user.email + '" appName="' + r.metadata.applicationName + '" answerId="' + r.id + '" keyword="' + $rootScope.result.keyword + '" question="' + $scope.newQuestion + '" style="float: left; border-radius:20px;" onclick="thumbsUp(this)" src="../assets/img/up.png" height="30px;" width="30px;">' +
                                '<img id="downImage-' + i + '" value="false" email="' + user.email + '" appName="' + r.metadata.applicationName + '" answerId="' + r.id + '" keyword="' + $rootScope.result.keyword + '" question="' + $scope.newQuestion + '" style="float: right; border-radius:20px;" onclick="thumbsDown(this)" src="../assets/img/down.png" height="30px;" width="30px;">' +
                                '</div>');
                        }
                    });
                    $scope.$apply();
                } else {
                    $scope.noResultMessage = {
                        display: 'block'
                    };
                    $scope.lookingFor = {
                        display: 'none'
                    };
                }
            });
        } else {
            $scope.isCloudantData = true;
            $scope.cloudantData = $rootScope.result;
            $scope.isLoading = false;
            $scope.$apply();
        }
    });

    /* This method escapes the Special Characters */
    function escapeSpecialCharacters(str) {
        return str.replace(/\\/g, "\\\\")
            .replace(/\$/g, "\\$")
            .replace(/'/g, "\\'")
            .replace(/"/g, "\\\"");
    }

    /*This method inserts ellipsis if the text length is more than 60*/
    $scope.truncate = function(string) {
        if (string.length > 60)
            return string.substring(0, 55) + '...';
        else
            return string;
    };

    $scope.lineBreaks = function (string) {
        return string.replace(/\n/g, '<br/>');
    };

    $scope.sendSearchData = function () {
        ipcr.send("popup-search", this.appName, $rootScope.redisData.question)
    };

    $scope.webSearch = function () {
        ipcr.send("search-web", $rootScope.redisData.question);
        closeWindow();
    };

    $scope.clean = function (c) {
        return $sce.trustAsHtml(c);
    };

    $scope.showDetails = function (id) {
        window.showDetails(id);
    };

    $scope.goBack = function (id) {
        window.goBack(id);
    };


    $scope.appName = "rephrase+Rephrase your question";
    $scope.showApplicationList = function () {
        $http({
            method: "GET",
            url: "https://844d8c57-58b6-4391-8b52-50492bc81db2-bluemix.cloudant.com/discovery-collection/b92685acb07f94e969aa1a10460e1e36",
            headers: {"Authorization": "Basic ODQ0ZDhjNTctNThiNi00MzkxLThiNTItNTA0OTJiYzgxZGIyLWJsdWVtaXg6YWNiYjBkNGM4YzVhMjUxZGIwNjBkMzg5MGZjOTI5YWZiYjczMmM4MGZmN2FmOTQ4ZGI1ZDRkYjUxMmYzMjdlYQ=="}
        }).then(result => {
            $scope.appListNames = [];
            console.log(result);
            $scope.appListNames = result.data.appList;
            $scope.appListNames.push({name: "Rephrase your question", shortName: "rephrase"});
            $scope.appListNames.push({name: "None of the above", shortName: "noneOfTheAbove"});
            $scope.parentDisableStyle = {display: "block"};
            $scope.didntAnswerStyle = {display: "block"};
            $scope.content0Style = {display: "block"};
            $scope.content1Style = {display: "none"};
        })
    };

}]);

app.controller('webSearchController', ['$scope', '$sce', function ($scope, $sce) {
    ipcr.send('getSearchTerm');
    ipcr.on('search-term', (e, searchTerm) => {
        searchTerm.forEach(term => {
            if(term.name === 'searchTerm'){
                $scope.searchURL = $sce.trustAsResourceUrl(`${config.webSearchURL}${term.value}`);
                $scope.$apply();
            }
        });
    });
}]);

