/**
 * Created by iSmile on 3/22/2017.
 */
const {ipcRenderer, remote, app} = require('electron');
const angularApp = angular.module('start', []);
const fs = require('fs');


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
        var data = '{"fname": "' + this.fname + '","lname": "' + this.lname + '" ,"email": "' + this.email + '"}';
        fs.writeFile("./user.json", data, function (err) {
            if (err) {
                //TODO: Need to decide what need to be done
                console.log(err);
            } else {
                ipcRenderer.send('openSearchBox');
                remote.getCurrentWindow().close();
            }

            console.log("The file was saved!");
        });
    };


}]);