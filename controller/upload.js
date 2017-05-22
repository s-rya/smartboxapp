/**
 * Created by iSmile on 5/18/2017.
 */
const {ipcRenderer, remote, app} = require('electron');
const dialog = remote.dialog;
const angularApp = angular.module('upload', []);
const fs = require('fs');
const rp = require('request-promise');

angularApp.controller('uploadCtrl', ['$scope','$rootScope', '$http', function ($scope,$rootScope, $http) {

    $scope.filePath = '';
    //$scope.applicationName = '';
    $http({
        method: "GET",
        url: "https://844d8c57-58b6-4391-8b52-50492bc81db2-bluemix.cloudant.com/discovery-collection/b92685acb07f94e969aa1a10460e1e36",
        headers: {"Authorization": "Basic ODQ0ZDhjNTctNThiNi00MzkxLThiNTItNTA0OTJiYzgxZGIyLWJsdWVtaXg6YWNiYjBkNGM4YzVhMjUxZGIwNjBkMzg5MGZjOTI5YWZiYjczMmM4MGZmN2FmOTQ4ZGI1ZDRkYjUxMmYzMjdlYQ=="}
    }).then(result => {
        $scope.appListNames = result.data.appList;
        $scope.appListNames.push({name:"None of the Above"});
        //$scope.$apply();
    });

    //To close the window and close the app when the user clicks on close
    $scope.closeUpload = function () {
        remote.getCurrentWindow().close();
    };

    //To save the user information into user.json file
    $scope.uploadDoc = function () {
        console.log('selectedAppName ::',this.selectedAppName);
        console.log('applicationName ::',$scope.applicationName);
        console.log($scope.filePath);
        console.log($scope.fileName);
        let appName = this.selectedAppName;
        if(appName === "None of the Above") appName = $scope.applicationName;
        ipcRenderer.send('startUpload', appName, $scope.filePath,$scope.fileName );
        remote.getCurrentWindow().close();
    };

    $scope.openUploadWindow = function () {
        dialog.showOpenDialog(remote.getCurrentWindow(), {
            title: 'Select file to upload',
            filters: [
                {name: 'Doc', extensions: ['docx']}
            ],
            properties: ['openFile']
        }, (file) => {
            if (file && file.length > 0) {
                $scope.filePath = file[0];
                $scope.fileSelected = true;
                $scope.fileName = file[0].split('\\').pop();
                $scope.$apply();
            }
        });
    }


}]);