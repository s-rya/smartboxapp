var {ipcRenderer, remote} = require('electron');
var app = angular.module('mainView', ['ngRoute', 'ngWebSocket', 'ngSanitize', 'ui.bootstrap', 'luegg.directives']);
//var app=angular.module('mainView', ['ngRoute', 'ngWebSocket', 'ngSanitize']);

app.factory('DataStream', function ($websocket) {
    // Open a WebSocket connection
    var dataStream = $websocket('wss://smartsearchboxservice.mybluemix.net');
    var context = {};
    //var dataStream = $websocket('wss://smartbox1.mybluemix.net');
    dataStream.onOpen(function (data) {
        console.log("connection opened");
        return dataStream;
    });

    dataStream.onClose(function (data) {
        console.log("connection closed" + data);
        dataStream.reconnect();
    });

    dataStream.onError(function (err) {
        console.log("connection closed" + err);
    });
    return dataStream;
});


//$scope.someData = {};
app.config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when(
            '/', {
                templateUrl: 'search-box.html',
                controller: 'chatWindow'
            }
        );
        $routeProvider.otherwise({redirectTo: '/'});
    }
    ]
);


app.controller('chatWindow', ['$scope', 'DataStream', function ($scope, DataStream) {

    let chatWindowHeight = 550;
    let isChatWindow = false;

    $scope.userMsg = [];

    $scope.openChatWindow = function () {
        $scope.chatWindowStyle = {
            display: 'block'
        };
        if (!isChatWindow) {
            isChatWindow = true;
            let request = {"input": {"text": 'hi'}, "user": {}, "context": DataStream.context};
            DataStream.send(request).then(function (resp) {
                console.log("watson request" + JSON.stringify(request));
            });
            ipcRenderer.send('resizeWithPos', 350, chatWindowHeight);
        }
    };

    ipcRenderer.on('popUpClosed', () => {
        console.log('recieved close event in UI');
        $scope.userMsg.push({"data": 'are you happy with the results?', "class": "bot"})
    });


    $scope.closeChatWindow = function () {
        isChatWindow = false;
        $scope.textbox = "";
        $scope.userMsg = [];
        $scope.chatWindowStyle = {
            display: 'none'
        };
        ipcRenderer.send('resizeWithPos', 350, 70, chatWindowHeight);
    };


    $scope.send = function () {
        if ($scope.textbox) {
            $scope.userMsg.push({"data": $scope.textbox, "class": "user"});
            let request = {"input": {"text": $scope.textbox}, "user": {}, "context": DataStream.context};
            $scope.textbox = "";
            DataStream.send(request).then(function (resp) {
                console.log("watson request" + JSON.stringify(request));
            });
        }
    };

    let headers = '<!DOCTYPE html><html lang="en"><head><title>SmartBox</title><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">';

    let scripts = '<script>if (typeof module === \'object\') {window.module = module;module = undefined;}</script>' +
        '<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">' +
        '<script src="assets/js/jquery.min.js"></script>' +
        '<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.4.8/angular.min.js"></script>' +
        '<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.4.8/angular-sanitize.js"></script>' +

        '<script>if (window.module) module = window.module;</script>' +
        '<script>function clickNext() {var nextValue = 0;var counter = parseInt(document.getElementById(\'counter\').value);var totalPages = parseInt(document.getElementById(\'finalCounter\').value);var finalCounter = totalPages - 1;var id = "content" + counter;if (counter == finalCounter) {counter = -1;}nextValue = counter + 1;document.getElementById(\'counter\').value = nextValue;document.getElementById(id).style.display = \'none\';document.getElementById("content" + nextValue).style.display = \'block\';document.getElementById("pageNumber").innerHTML = (parseInt(nextValue)+1) +"/"+ totalPages;}function clickPrevious() {var pastValue = 0;var counter = parseInt(document.getElementById(\'counter\').value);var totalPages = parseInt(document.getElementById(\'finalCounter\').value);var finalCounter = totalPages - 1;var id = "content" + counter;if (counter == 0) {counter = finalCounter + 1;}pastValue = counter - 1;document.getElementById(\'counter\').value = pastValue;document.getElementById(id).style.display = \'none\';document.getElementById("content" + pastValue).style.display = \'block\';document.getElementById("pageNumber").innerHTML = (parseInt(pastValue)+1)+"/"+ totalPages;}</script>' +
        '<script>const remote = require(\'electron\').remote;function closeWindow(){var window = remote.getCurrentWindow();window.close();}</script>';

    let style = '<style>' +
        'body {  font-family: "Lato", sans-serif !important;' +
        '   padding:0;' +
        '   margin:0;' +
        '   background: rgba(0, 0, 0, 0);  }' +
        '.contentRead { ' +
        '   overflow-y: auto; ' +
        '   padding:10px 20px;' +
        '   height: 576px; ' +
        '   font-size:14px;' +
        '   margin-top: 22px;' +
        '   display: none; ' +
        '   BACKGROUND: WHITE; ' +
        '   OPACITY: 1;' +
        '   border-top: 1px solid #99F8FF; ' +
        '   border-bottom: 1px solid #99F8FF; ' +
        '   border-right: 1px solid #99F8FF;' +
        '   border-left: 1px solid #99F8FF; }  ' +
        '#content0 {  display: block;  }  ' +
        '#readingPane {  float: left;  ' +
        '   -webkit-border-radius: 8px;  ' +
        '   -moz-border-radius: 8px;  ' +
        '   box-shadow: 0px 5px 6px #99F8FF;  ' +
        '   -webkit-box-shadow: 0px 5px 6px #99F8FF; ' +
        '   background: white;  ' +
        '   behavior: url(/pie/PIE.htc);  ' +
        '   height: 624px;' +
        '   display: block;  ' +
        '   width: 836px;  ' +
        '   border: 1px solid #ccc; ' +
        '   opacity: 1;' +
        '   BACKGROUND: GHOSTWHITE;' +
        '   border-radius: 6px;  ' +
        '   color: black;  }' +
        '.pointers {  color: black;' +
        '   text-align:center; ' +
        '   font-weight: bold;  }' +
        '</style>';

    const setPopUpData = function (data) {
        let html = headers + scripts + style + '</head><body>' +
            '<div id="readingPane" ng-app="popup">' +
            '<div id="close" style="float: right; margin-right: 5px; height: 20px;"><button type="button" class="close" aria-label="Close" onclick="closeWindow()">' +
            '<span aria-hidden="true">&times;</span></button></div>';
        data.forEach((d, i) => {
            html = html + '<div class="contentRead" id="content' + i + '" ng-bind-html=' + d + '</div>';
        });
        return html + '<input type="hidden" value="0" id="counter"/>' +
            '<input type="hidden" value="' + data.length + '" id="finalCounter"/>' +
            '<div class="pointers">' +
            '<span id="prev" style="cursor: pointer" onclick="clickPrevious()"> < &nbsp;&nbsp;&nbsp; </span> ' +
            '<span id="pageNumber"> 1/' + data.length + ' </span>' +
            '<span id="next" style="cursor: pointer" onclick="clickNext()"> &nbsp;&nbsp;&nbsp; > </span>' +
            '</div></div></body></html>';
    };

    const makeIncidentTable = function (data) {
        let html = headers + scripts + style + '</head><body>' +
            '<div id="readingPane" ng-app="popup"><div id="close" style="float: right; margin-right: 5px; height: 20px;"><button type="button" class="close" aria-label="Close" onclick="closeWindow()">' +
            '<span aria-hidden="true">&times;</span></button></div><div class="container"><h2>Incidents</h2>' +
            '<div class="table-responsive">' +
            '<table class="table"><thead><tr><th>#</th><th>Priority</th><th>Description</th></tr></thead><tbody>';

        data.forEach((d, i) => {
            console.log(d);
            html = html + '<tr><td>' + d.incidentRef + '</td><td>' + d.priority + '</td><td>' + d.incidentDesc + '</td></tr>';
        });
        return html + '</tbody></table></div></div></div></body></html>';
    };

    DataStream.onMessage(function (message) {
        console.log(message);
        let data = JSON.parse(message.data);
        let res = data.result;
        let resArray = [];
        if (data.type === 'discovery') {

            res.forEach(r => {
                resArray.push(r['Documentation with HTML']);
                // $scope.discoveryData.push({"data": r['Documentation with HTML'], "class": "bot"});
                //$scope.userMsg.push({"data": r['Documentation with HTML'], "class": "bot"});
            });
            ipcRenderer.send('openPopUp', setPopUpData(resArray));
        } else if (data.type === 'cloudant') {
            ipcRenderer.send('openPopUp', makeIncidentTable(res));
            /*res.forEach(r => {
                let text = '<b>Incident Id: </b>' + r.incidentId + '<br>' +
                    '<b>Priority:</b> ' + r.priority + '<br>' +
                    '<b>Description: </b>' + r.incidentDesc;
                //$scope.userMsg.push({"data": text, "class": "bot"});
            });*/
        } else {
            $scope.userMsg.push({"data": res, "class": "bot"});
        }
    });
}]);