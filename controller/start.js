/**
 * Created by iSmile on 3/22/2017.
 */
const {ipcRenderer, remote, app} = require('electron');
const angularApp = angular.module('start', []);
const path = require("path");
const fs = require('fs');
const {getMac, isMac} = require('getmac');

angularApp.controller('userController', ['$scope', function ($scope) {

    //To close the window and close the app when the user clicks on close
    $scope.closeStart = function () {
        ipcRenderer.send('exit');
        remote.getCurrentWindow().close();
    };

    //To save the user information into user.json file
    $scope.saveUserInfo = function () {
        console.log(this.fname);
        console.log(this.lname);
        var email = this.email;
        getMac((error, mac) => {
            var data = '{"fname": "' + this.fname + '","lname": "' + this.lname + '" ,"email": "' + this.email + '","macAddress": "' + mac + '"}';
            fs.writeFile(path.join(__dirname, "../user.json"), data, function (err) {
                if (err) {
                    //TODO: Need to decide what need to be done
                    console.log(err);
                } else {
                    ipcRenderer.send('openSearchBox', email, mac);
                    remote.getCurrentWindow().close();
                }

                console.log("The file was saved!");
            });
        });
    };
}]);