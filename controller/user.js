/**
 * Created by iSmile on 6/16/2017.
 */
const {ipcRenderer, remote, app} = require('electron');
const angularApp = angular.module('activation', []);
const path = require("path");
const config = require('./../config/config');
const fs = require('fs');
const {getMac, isMac} = require('getmac');


angularApp.controller('checkUserController', ['$scope', '$http', function ($scope, $http) {

    //To close the window and close the app when the user clicks on close
    $scope.closeStart = function () {
        ipcRenderer.send('exit');
        remote.getCurrentWindow().close();
    };

    //To save the user information into user.json file
    $scope.requestAccess = function () {
        ipcRenderer.send('requestAccess');
        remote.getCurrentWindow().close();
    };


    $scope.verifyCode = function () {
        let activationCode = this.activationCode.trim();
        getMac((error, mac) => {
            fs.readFile(path.join(__dirname, "../user.json"), function (err, data) {
                data = JSON.parse(data);
                $http({
                    method: "POST",
                    url: config.smartboxserviceURL + "activationCode",
                    data: JSON.stringify({email: data.email, macAddress: mac, activationKey: activationCode})
                }).then(result => {
                    if (result.data.canUse) {
                        ipcRenderer.send('openApp');
                        remote.getCurrentWindow().close();
                    } else {
                        $scope.activationFail = true;
                    }
                    console.log('sssss', result);
                    //$scope.$apply();
                });
            });
        });

    };

}]);