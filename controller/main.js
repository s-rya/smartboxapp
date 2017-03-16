const {ipcRenderer, remote} = require('electron');
const app = angular.module('mainView', ['ngRoute', 'ngWebSocket', 'ngSanitize', 'ui.bootstrap', 'luegg.directives']);
const numbers = {
    '1' : '',
    '2' : 'second ',
    '3' : 'third ',
    '4' : 'fourth ',
    '5' : 'fifth ',
    '6' : 'sixth ',
    '7' : 'seventh ',
    '8' : 'eighth ',
    '9' : 'ninth ',
    '10' : 'tenth '
};

//Angular factory module for Websocket connection to SmartBox service
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

    //To open the chat window when clicks on the Search Box
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
            ipcRenderer.send('resizeWithPos', 335, chatWindowHeight);
        }
    };

    ipcRenderer.on('popUpClosed', () => {
        console.log('recieved close event in UI');
        //$scope.userMsg.push({"data": 'are you happy with the results?', "class": "bot"})
    });


    //To close the chat window when the user click on close
    $scope.closeChatWindow = function () {
        isChatWindow = false;
        $scope.textbox = "";
        $scope.userMsg = [];
        $scope.chatWindowStyle = {
            display: 'none'
        };
        ipcRenderer.send('resizeWithPos', 335, 70, chatWindowHeight);
    };

    //To send the message to SmartBox service when the user hits enter
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

    let headers = '<!DOCTYPE html><html lang="en"><head><title>SmartBox</title><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">';

    let scripts = '<script>if (typeof module === \'object\') {window.module = module;module = undefined;}</script>' +
        '<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">' +
        '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js"></script>' +
        '<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.4.8/angular.min.js"></script>' +
        '<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.4.8/angular-sanitize.js"></script>' +
        '<script>if (window.module) module = window.module;</script>' +
        '<script>function clickNext() {var nextValue = 0;var counter = parseInt(document.getElementById(\'counter\').value);var totalPages = parseInt(document.getElementById(\'finalCounter\').value);var finalCounter = totalPages - 1;var id = "content" + counter;if (counter == finalCounter) {counter = -1;}nextValue = counter + 1;document.getElementById(\'counter\').value = nextValue;document.getElementById(id).style.display = \'none\';document.getElementById("content" + nextValue).style.display = \'block\';document.getElementById("pageNumber").innerHTML = (parseInt(nextValue)+1) +"&nbsp;/&nbsp;"+ totalPages;}function clickPrevious() {var pastValue = 0;var counter = parseInt(document.getElementById(\'counter\').value);var totalPages = parseInt(document.getElementById(\'finalCounter\').value);var finalCounter = totalPages - 1;var id = "content" + counter;if (counter == 0) {counter = finalCounter + 1;}pastValue = counter - 1;document.getElementById(\'counter\').value = pastValue;document.getElementById(id).style.display = \'none\';document.getElementById("content" + pastValue).style.display = \'block\';document.getElementById("pageNumber").innerHTML = (parseInt(pastValue)+1)+"&nbsp;/&nbsp;"+ totalPages;}</script>' +
        '<script>function showDetails(incidentId) {document.getElementById(\'incidentContainer\').style.display = "none";document.getElementById(incidentId + \'container\').style.display = "block";document.getElementById(incidentId).style.color = "#551A8B";}function goBack(incidentId) {document.getElementById(\'incidentContainer\').style.display = "block";document.getElementById(incidentId + \'container\').style.display = "none";}</script>' +
        '<script>const remote = require(\'electron\').remote;function closeWindow(){var window = remote.getCurrentWindow();window.close();}</script>';

    let style = '<style>' +
        'body {  font-family: "Lato", sans-serif !important;' +
        '   padding:0;' +
        '   margin:0;' +
        '   background: rgba(0, 0, 0, 0);  }' +
        '.contentRead { ' +
        '   overflow-y: auto; ' +
        '   padding:15px 40px;' +
        '   height: 585px; ' +
        '   font-size:12px;' +
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
        '   height: 633px;' +
        '   display: block;  ' +
        '   width: 720px;  ' +
        '   border: 1px solid #ccc; ' +
        '   opacity: 1;' +
        '   BACKGROUND: GHOSTWHITE;' +
        '   border-radius: 6px;  ' +
        '   color: black;  }' +
        '.pointers {  color: #707070;' +
        '   text-align:center; ' +
        '   font-weight: bold;' +
        '   font-size: 12px;  ' +
        '   padding-top: 3px;  }' +
        '.pointers:hover {  ' +
        '   color: black;  }' +
        '.heading{ position: absolute;' +
        '   width: 97%;' +
        '   text-align: center;' +
        '   -webkit-app-region: drag;' +
        '    height: 22px;} ' +
        'img{' +
        '   max-width: 650px} ' +
        '#backButton {  ' +
        '   width: 42px;  ' +
        '   height: 42px;  }  ' +
        '.backImg {  ' +
        '   width: 28px;  ' +
        '   height: 28px;  ' +
        '   margin-top: 15px;  ' +
        '   border-radius: 50%/50%;  ' +
        '   background-color: white;  ' +
        '   -moz-transform: scaleX(-1); ' +
        '   -o-transform: scaleX(-1);  ' +
        '   -webkit-transform: scaleX(-1);  ' +
        '   transform: scaleX(-1);  ' +
        '   filter: FlipH;  ' +
        '   -ms-filter: "FlipH";  ' +
        '   cursor: pointer;  ' +
        '   left: -20px;  }  ' +
        '.backImg:hover, .editImg:hover {  ' +
        '   width: 42px;  ' +
        '   height: 42px;  ' +
        '   box-shadow: 0 0 10px rgba(0, 0, 0, 0.6);  ' +
        '   -moz-box-shadow: 0 0 10px rgba(0, 0, 0, 0.6);  ' +
        '   -webkit-box-shadow: 0 0 10px rgba(153, 248, 255, 0.6); ' +
        '   -o-box-shadow: 0 0 10px rgba(153, 248, 255, 0.6);  }  ' +
        '.editImg {  ' +
        '   width: 28px; ' +
        '   height: 28px;  ' +
        '   margin-top: 15px;  ' +
        '   border-radius: 50%/50%; ' +
        '   background-color: white;  ' +
        '   cursor: pointer;  }  ' +
        '.incDetContainer {  ' +
        '   box-shadow: 0 0 10px rgba(0, 0, 0, 0.6);' +
        '   -moz-box-shadow: 0 0 10px rgba(0, 0, 0, 0.6)); ' +
        '   -webkit-box-shadow: 0 0 10px rgba(0, 0, 0, 0.6)); ' +
        '   -o-box-shadow: 0 0 10px rgba(0, 0, 0, 0.6));' +
        '   padding-left: 10px; ' +
        '   padding-bottom: 10px; ' +
        '   border-radius: 10px;  } ' +
        '.navigation {  ' +
        '   height: 40px;  }' +
        '</style>';

    //To set up the Pop up HTML for Discovery service data
    const setPopUpData = function (data) {
        let html = headers + scripts + style + '</head><body>' +
            '<script>angular.module(\'popup\', [\'ngSanitize\']).controller(\'dataCtrl\', [\'$scope\', \'$sce\', function ($scope, $sce) {var array = \''+data.join('###########')+'\';$scope.snippet = array.split(\'###########\');$scope.clean = function(c){return $sce.trustAsHtml(c);};}]);</script>' +
            '<div id="readingPane" ng-app="popup"  ng-controller="dataCtrl">' +
            '<div class="heading"></div>' +
            '<div id="close" style="float: right; margin-right: 5px; height: 20px;"><button type="button" class="close" aria-label="Close" onclick="closeWindow()">' +
            '<span aria-hidden="true">&times;</span></button></div>' +
            '<div ng-bind-html="clean(msg)" ng-repeat="msg in snippet" class="contentRead" id="content{{$index}}"></div>';

        return html + '<input type="hidden" value="0" id="counter"/>' +
            '<input type="hidden" value="' + data.length + '" id="finalCounter"/>' +
            '<div class="pointers">' +
            '<span id="prev" style="cursor: pointer" onclick="clickPrevious()"> < &nbsp;&nbsp;&nbsp; </span> ' +
            '<span id="pageNumber"> 1&nbsp;/&nbsp;' + data.length + ' </span>' +
            '<span id="next" style="cursor: pointer" onclick="clickNext()"> &nbsp;&nbsp;&nbsp; > </span>' +
            '</div></div></body></html>';
    };

    //To set up the Pop up HTML for Cloudant data
    const makeIncidentTable = function (data) {
        let html = headers + scripts + style + '</head><body>' +
            '<div id="readingPane" ng-app="popup"><div class="heading"></div><div id="close" style="float: right; margin-right: 5px; height: 20px;"><button type="button" class="close" aria-label="Close" onclick="closeWindow()">' +
            '<span aria-hidden="true">&times;</span></button></div>' +
            '<div class="contentRead" id="content0">' +
            '<div class="container" id="incidentContainer" style="display:block"><h2>Incidents</h2>' +
            '<div class="table-responsive">' +
            '<table class="table"><thead><tr><th>#</th><th>Priority</th><th>Description</th></tr></thead><tbody>';
        let incidentCardHtml = '';
        data.forEach(d => {
            html = html + '<tr><td class="incident" id="'+d.incidentRef+'" style="cursor:pointer;color:#0000EE;" onclick="showDetails(\''+d.incidentRef+'\')">' + d.incidentRef + '</td><td>' + d.priority + '</td><td>' + truncate(d.incidentDesc) + '</td></tr>';
            incidentCardHtml = incidentCardHtml + '<div id="'+d.incidentRef+'container" class="incDetContainer" style="display:none">' +
                '<div class="navigation">' +
                '<div id="backButton" onclick="goBack(\''+d.incidentRef+'\')" style="marign:0;padding:0; float:left;"><img src="http://icons.iconarchive.com/icons/icons8/ios7/512/Arrows-Right-icon.png" class="backImg" alt="Back"></div>' +
                '<div id="editButton" style="padding:0;float:right;margin-right:10px;"><img src="https://cdn3.iconfinder.com/data/icons/google-material-design-icons/48/ic_mode_edit_48px-128.png" class="editImg" alt="Edit"></div></div>' +
                '<div class="card" style="width: 50rem;margin-left:20px;margin-right:20px;"><div class="card-block">' +
                '<h2 class="card-title">'+d.incidentRef+'</h2>' +
                '<p class="card-text priority"><b>Priority:</b><br/>'+d.priority+'</p>' +
                '<p class="card-text description"><b>Description:</b><br/>'+d.incidentDesc+'</p>' +
                '</div></div></div>';
        });
        return html + '</tbody></table></div></div>' + incidentCardHtml +
            '</div></div></body></html>';
    };

    /*This method inserts ellipsis if the text length is more than 60*/
    function truncate(string) {
        if (string.length > 60)
            return string.substring(0, 55) + '...';
        else
            return string;
    }


    //Message receiver from SmartBox Service
    DataStream.onMessage(function (message) {
        console.log(message);
        let data = JSON.parse(message.data);
        let res = data.result;
        let resArray = [];
        if (data.context) {
            DataStream.context = data.context;
        }
        if (data.type === 'discovery') {
            res.forEach((r,i) => {
                resArray.push(
                    '<p><b>Here is the '+ numbers[i+1]+'best answer for: <i>'+ data.question +'</i></b></p><p align="center"><b>' + r['Item Name'] + '</b></p>' + r['Documentation with HTML'].replace(/\\/g, "\\\\")
                        .replace(/\$/g, "\\$")
                        .replace(/'/g, "\\'")
                        .replace(/"/g, "\\\""));
            });
            $scope.userMsg.push({"data": 'SmartBox is showing the best results now.', "class": "bot"});
            ipcRenderer.send('openPopUp', setPopUpData(resArray));
        } else if (data.type === 'cloudant') {
            $scope.userMsg.push({"data": 'SmartBox is showing the best results now.', "class": "bot"});
            ipcRenderer.send('openPopUp', makeIncidentTable(res));
        } else {
            if(isChatWindow){
                $scope.userMsg.push({"data": res, "class": "bot"});
                if(data.event && data.event === 'closeWindow'){
                    $scope.closeChatWindow();
                }
            }
        }
    });
}]);