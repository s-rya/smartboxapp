const {ipcRenderer, remote} = require('electron');
const dialog = remote.dialog;
const app = angular.module('mainView', ['ngRoute', 'ngWebSocket', 'ngSanitize', 'ui.bootstrap', 'luegg.directives']);
const config = require('./../config/config');
const fs = require('fs');
const rp = require('request-promise');



//Angular factory module for Websocket connection to SmartBox service
app.factory('DataStream', function ($websocket) {
    // Open a WebSocket connection
    //var dataStream = $websocket('wss://smartsearchboxservice.mybluemix.net');
    var dataStream = $websocket('wss://smart-dev.mybluemix.net');
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
    const user = require('../user.json');
    //const user = require('../../../user.json');
    $scope.userMsg = [];

    //To open the chat window when clicks on the Search Box
    $scope.openChatWindow = function () {
        $scope.chatWindowStyle = {
            display: 'block'
        };
        if (!isChatWindow) {
            isChatWindow = true;
            let name = user.fname.charAt(0).toUpperCase() + user.fname.substr(1).toLowerCase();
            $scope.userMsg.push({
                "data": 'Hello ' + name + '! I\'m Smart Box. What are you looking for?',
                "class": "bot"
            });
            ipcRenderer.send('resizeWithPos', 335, chatWindowHeight);
        }
    };

    ipcRenderer.on('popUpClosed', () => {
        console.log('recieved close event in UI');
        //$scope.userMsg.push({"data": 'are you happy with the results?', "class": "bot"})
    });

    $scope.showInfoMsg = function () {
        $scope.infoClassStyle = {
            display: 'block'
        };
    };

    $scope.closeInfoMsg = function () {
        $scope.infoClassStyle = {
            display: 'none'
        };
    };

    //To close the chat window when the user click on close
    $scope.closeChatWindow = function () {
        isChatWindow = false;
        $scope.textbox = "";
        $scope.userMsg = [];
        $scope.chatWindowStyle = {
            display: 'none'
        };
        $scope.infoClassStyle = {
            display: 'none'
        };
        ipcRenderer.send('resizeWithPos', 335, 70, chatWindowHeight);
    };

    //To send the message to SmartBox service when the user hits enter
    $scope.send = function () {
        let text = $scope.textbox;
        if (text) {
            const uploadRegex = /^(upload document|upload doc)$/ig;
            const helpRegex = /^(help|help me)$/ig;
            $scope.userMsg.push({"data": text, "class": "user"});
            if(uploadRegex.test(text.trim())){
                ipcRenderer.send('upload-box');
                /*dialog.showOpenDialog(remote.getCurrentWindow(),{
                    title: 'Select file to upload',
                    filters: [
                        { name: 'Doc', extensions: ['docx'] }
                    ],
                    properties: ['openFile']
                },(file) => {
                    if(file && file.length > 0) {
                        dialog.showMessageBox(remote.getCurrentWindow(),{
                            type:"info",
                            buttons: ["Ok"],
                            defaultId: 0,
                            title: "Document upload",
                            message: "Document upload is in progress."
                        });

                        rp({
                            method: 'POST',
                            url: config.smartboxserviceURL + 'upload',
                            headers: {
                                'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW'
                            },
                            formData: {
                                file: { value: fs.createReadStream(file[0]),
                                    options: { filename: file[0].split('\\').pop(), contentType: null } }
                            }
                        }).then(data => {
                            console.log(data.success);
                            console.log(data);
                            if(data && JSON.parse(data).success){
                                dialog.showMessageBox(remote.getCurrentWindow(),{
                                    type:"info",
                                    buttons: ["Ok"],
                                    defaultId: 0,
                                    title: "Document upload",
                                    message: "Document uploaded successfully."
                                });
                            }
                            //TODO: Need to handle error cases
                        }).catch(err => {
                            console.log(err);

                        });
                    }
                });*/
            } else if(helpRegex.test(text.trim())){
                $scope.userMsg.push({"data": 'Just type in to get the results like <i>Dealers in TESS, what is reevoo?<i>', "class": "bot"});
            }else {
                DataStream.send({
                    "input": {"text": text},
                    "user": user,
                    "context": DataStream.context
                }).then(function (resp) {
                    console.log("watson request" + JSON.stringify({
                            "input": {"text": text},
                            "user": user,
                            "context": DataStream.context
                        }));
                });
            }
            $scope.textbox = "";
        }
    };

    let headers = '<!DOCTYPE html><html lang="en"><head><title>SmartBox</title><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">';

    let scripts = '<script>if (typeof module === \'object\') {window.module = module;module = undefined;}</script>' +
        '<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">' +
        '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js"></script>' +
        '<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.4.8/angular.min.js"></script>' +
        '<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.4.8/angular-sanitize.js"></script>' +
        '<script>if (window.module) module = window.module;</script>' +
        '<script>const shell = require(\'electron\').shell;$(document).on(\'click\', \'a[href^="http"]\', function(event) {event.preventDefault();shell.openExternal(this.href);});</script>' +
        '' +
        '<script>function viewMoreResults(){document.getElementById("content0").style.display = "none";document.getElementById("content1").style.display = "block";}</script>' +
        '<script>function showPrev(){document.getElementById("content1").style.display = "none";document.getElementById("content0").style.display = "block";}</script>' +
        '<script>function showAppList(){document.getElementById("parentDisable").style.display = "block";document.getElementById("didntAnswer").style.display = "block";document.getElementById("content1").style.display = "none";document.getElementById("content0").style.display = "block";}</script>' +
        '<script>function closeApplist(){document.getElementById("parentDisable").style.display = "none";document.getElementById("didntAnswer").style.display = "none";}</script>' +
        '<script>const rem = require(\'electron\').remote;const dialog = rem.dialog;function openUploadWindow() {ipcr.send("upload-box");}</script>' +
        '' +
        '<script>function clickNext() {var nextValue = 0;var counter = parseInt(document.getElementById(\'counter\').value);var totalPages = parseInt(document.getElementById(\'finalCounter\').value);var finalCounter = totalPages - 1;var id = "content" + counter;if (counter == finalCounter) {counter = -1;}nextValue = counter + 1;document.getElementById(\'counter\').value = nextValue;document.getElementById(id).style.display = \'none\';document.getElementById("content" + nextValue).style.display = \'block\';document.getElementById("pageNumber").innerHTML = (parseInt(nextValue)+1) +"&nbsp;/&nbsp;"+ totalPages;}function clickPrevious() {var pastValue = 0;var counter = parseInt(document.getElementById(\'counter\').value);var totalPages = parseInt(document.getElementById(\'finalCounter\').value);var finalCounter = totalPages - 1;var id = "content" + counter;if (counter == 0) {counter = finalCounter + 1;}pastValue = counter - 1;document.getElementById(\'counter\').value = pastValue;document.getElementById(id).style.display = \'none\';document.getElementById("content" + pastValue).style.display = \'block\';document.getElementById("pageNumber").innerHTML = (parseInt(pastValue)+1)+"&nbsp;/&nbsp;"+ totalPages;}</script>' +
        '<script>function showDetails(incidentId) {document.getElementById(\'incidentContainer\').style.display = "none";document.getElementById(incidentId + \'container\').style.display = "block";document.getElementById(incidentId).style.color = "#551A8B";}function goBack(incidentId) {document.getElementById(\'incidentContainer\').style.display = "block";document.getElementById(incidentId + \'container\').style.display = "none";}</script>' +
        '<script>$(document).ready(function(){$("div[id^=\'block\']").click(function(){let divID = $(this).attr(\'id\');if($("#"+divID + "feedback").is(":visible")){$(this).css("height", "60px").css("display","-webkit-box");$("#"+divID + "feedback").hide();} else {$(this).css("height", "auto").css("display","block");$("#"+divID + "feedback").show();}for(i=0;i<10;i++){if(divID!="block"+i)$("#block"+i).css(\'height\',\'60px\').css("display","-webkit-box");if(divID+"feedback"!="block"+i+"feedback"){$("#block"+i+\'feedback\').hide();}}});});</script>' +
        '<script>function thumbsUp(ele){var number = $(ele).attr(\'id\').split("-")[1]; var id = $(ele).attr(\'id\'); if($("#"+id).css("backgroundColor") == "rgba(0, 0, 0, 0)"){$("#"+id).css("backgroundColor","greenyellow");$("#" + id).attr("value","true");}else{$("#"+id).css("backgroundColor","rgba(0, 0, 0, 0)");$("#" + id).attr("value","false");} $("#downImage-" + number).attr("value","false");$("#downImage-"+number).css("backgroundColor","rgba(0, 0, 0, 0)") }</script>' +
        '<script>function thumbsDown(ele){var number = $(ele).attr(\'id\').split("-")[1]; var id = $(ele).attr(\'id\'); if($("#"+id).css("backgroundColor") == "rgba(0, 0, 0, 0)"){$("#"+id).css("backgroundColor","blueviolet");$("#" + id).attr("value","true");}else{$("#"+id).css("backgroundColor","rgba(0, 0, 0, 0)");$("#" + id).attr("value","false");} $("#upImage-" + number).attr("value","false");$("#upImage-"+number).css("backgroundColor","rgba(0, 0, 0, 0)")}</script>' +
        '<script>const remote = require(\'electron\').remote;var payload = [];function closeWindow(){for (i = 0; i < 10; i++) {if($("#upImage-"+ i).attr("value") === "true") {payload.push({"id" : $("#upImage-"+ i).attr("answerId") + "test", "question":$("#upImage-"+ i).attr("question"),"keyword": $("#upImage-" + i).attr("keyword"),"appName": $("#upImage-" + i).attr("appName"), "rank":"good"})} else if ($("#downImage-"+ i).attr("value") === "true") {payload.push({"id" : $("#upImage-"+ i).attr("answerId") + "test", "question":$("#upImage-"+ i).attr("question"),"keyword": $("#upImage-" + i).attr("keyword"),"appName": $("#upImage-" + i).attr("appName"), "rank":"bad"})}}ipcr.send("rankResults",{email: "'+ user.email +'",payload: payload});var window = remote.getCurrentWindow();window.close();}</script>';

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
        '.incDetContainer1 {  ' +
        '   border-bottom: 1px solid #99F8FF;  ' +
        '   margin-bottom: 10px;  ' +
        '   cursor: pointer;    ' +
        '   padding-bottom: 25px;   ' +
        '   padding-top: 5px;  }' +
        '' +
        '#parentDisable {' +
        '   display: none;' +
        '   position:fixed;' +
        '   top:24px;' +
        '   left:0;' +
        '   background:white;' +
        '   opacity:0.8;' +
        '   z-index:998;' +
        '   height:94%;' +
        '   width:99%;   }' +
        'input[type=radio] { margin-top: 1px; } ' +
        '.appRadio {  ' +
        '   border-bottom: 1px solid #99F8FF;' +
        '   height: 45px; ' +
        '   padding-top: 10px; ' +
        '   padding-left: 10px;  }  ' +
        '.didntAnswer {      ' +
        '   margin-top: 65px;' +
        '   margin-left: 97px;' +
        '   background-color: ghostwhite;' +
        '   width: 524px;  ' +
        '   height:500px;' +
        '   padding: 20px; ' +
        '   border-radius: 20px; ' +
        '   box-shadow: 0 0 10px rgba(0, 0, 0, 0.6);' +
        '   -moz-box-shadow: 0 0 10px rgba(0, 0, 0, 0.6));' +
        '   -webkit-box-shadow: 0 0 10px rgba(0, 0, 0, 0.6)); ' +
        '   -o-box-shadow: 0 0 10px rgba(0, 0, 0, 0.6));  } ' +
        '.scrollList{    ' +
        '   height: 400px;' +
        '   overflow-y: auto;' +
        '}' +
        '</style>';

    //To set up the Pop up HTML for Discovery service data
    const setPopUpData = function (data, question) {
        let html = headers + scripts + style + '</head><body>' +
            '<script>' +
            'const ipcr = require("electron").ipcRenderer;' +
            'angular.module("popup", ["ngSanitize"])' +
            '.controller("dataCtrl", ["$scope", "$sce","$http", function ($scope, $sce, $http) { ' +
            '   $scope.sendSearchData = function(){' +
            '       ipcr.send("popup-search",this.appName,\''+question+'\');    };' +
            '   $scope.appName = "rephrase+Rephrase your question";' +
            '   $scope.showApplicationList = function(){' +
            '      $http({' +
            '               method:"GET",' +
            '               url: "https://844d8c57-58b6-4391-8b52-50492bc81db2-bluemix.cloudant.com/discovery-collection/b92685acb07f94e969aa1a10460e1e36",' +
            '               headers: {  "Authorization": "Basic ODQ0ZDhjNTctNThiNi00MzkxLThiNTItNTA0OTJiYzgxZGIyLWJsdWVtaXg6YWNiYjBkNGM4YzVhMjUxZGIwNjBkMzg5MGZjOTI5YWZiYjczMmM4MGZmN2FmOTQ4ZGI1ZDRkYjUxMmYzMjdlYQ=="  }' +
            '           }).then(result => {' +
            '               $scope.appListNames = [];' +
            '               console.log(result);' +
            '               $scope.appListNames = result.data.appList;' +
            '               $scope.appListNames.push({name:"Rephrase your question", shortName:"rephrase"});' +
            '               $scope.appListNames.push({name:"None of the above", shortName:"noneOfTheAbove"});' +
            '               $scope.parentDisableStyle = { display: "block" }; ' +
            '               $scope.didntAnswerStyle = { display: "block" };' +
            '               $scope.content0Style = { display: "block" };' +
            '               $scope.content1Style = { display: "none" };' +
            '           })' +
            '   };' +
            '   var array = \'' + data.join('###########') + '\';' +
            '   $scope.snippet = array.split(\'###########\');' +
            '   $scope.clean = function(c){' +
            '       return $sce.trustAsHtml(c);};}]);' +
            '</script>' +
            '' +
            '' +
            '' +
            '<div id="readingPane" ng-app="popup"  ng-controller="dataCtrl">' +
            '<div class="heading"></div>' +
            '<div id="parentDisable" ng-style="parentDisableStyle"></div>' +
            '<div id="close" style="float: right; margin-right: 5px; height: 20px;"><button type="button" class="close" aria-label="Close" onclick="closeWindow()">' +
            '<span aria-hidden="true">&times;</span></button></div>' +
            '' +
            '<div ng-if="snippet.length > 5" ng-style="content1Style" class="contentRead" id="content1">' +
            '<div class="incDetContainer1" ng-repeat="msg in snippet | limitTo: 5-snippet.length">' +
            '<div id="block{{$index+5}}" style="height: 60px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2;-webkit-box-orient: vertical;text-overflow: ellipsis;" ng-bind-html="clean(msg)">' +
            '</div></div>' +
            '<div style="float: left" onclick="showPrev()"><a href>&lt;&lt; Back</a></div>' +
            '<div style="float: right" ng-click="showApplicationList()"><a href>Didn\'t get your answer?</a></div></div>' +
            '' +
            '<div id="didntAnswer" class="didntAnswer" ng-style="didntAnswerStyle" style="display: none;position: absolute; z-index:999"><div id="close" style="float: right; margin-top: -10px;margin-right: -5px;" onclick="closeApplist()">' +
            '<button type="button" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>' +
            '<div class="selectApp" style="height: 500px"><p>Please select the application in which you want to search:</p><form ng-submit="sendSearchData()">' +
            '<div class="scrollList">' +
            '<div ng-repeat="app in appListNames" class="radio appRadio"><label><input type="radio" style="margin-top: 4px;" ng-model="$parent.appName" value={{app.shortName}}+{{app.name}}>{{app.name}}</label></div>' +
            '' +
            '' +
            /*'<div class="radio appRadio"><label><input type="radio" style="margin-top: 4px;" ng-model="appName" ng-required="!appName" value="rephrase">Rephrase your question</label></div>' +
            '<div class="radio appRadio"><label><input type="radio" style="margin-top: 4px;" ng-model="appName" ng-required="!appName" value="tess+Honda TESS">Honda TESS</label></div>' +
            '<div class="radio appRadio"><label><input type="radio" style="margin-top: 4px;" ng-model="appName" ng-required="!appName" value="webepc+Honda WebEPC">Honda WebEPC</label></div>' +
            '<div class="radio appRadio"><label><input type="radio" style="margin-top: 4px;" ng-model="appName" ng-required="!appName" value="mdm+Honda MDM">Honda MDM</label></div>' +
            '<div class="radio appRadio"><label><input type="radio" style="margin-top: 4px;" ng-model="appName" ng-required="!appName" value="customerdb+Honda CustomerDB">Honda CustomerDB</label></div>' +
            '<div class="radio appRadio"><label><input type="radio" style="margin-top: 4px;" ng-model="appName" ng-required="!appName" value="drama+Honda DRAMA">Honda DRAMA</label></div>' +*/
            /*'<div class="radio appRadio"><label><input type="radio" style="margin-top: 4px;" ng-model="$parent.appName" value="upload">None of the above</label>' +*/
            '<div ng-switch="appName"><div ng-switch-when="noneOfTheAbove+None of the above" onclick="openUploadWindow()">' +
            '<button style="float: right; margin-top: -52px;  margin-left: 220px; " id="submit" type="submit" class="btn btn-primary">Upload Document for new Application</button></div></div>' +
            '</div><div style="margin: auto; width: 12%"><button style="margin-top: 10px" id="submit" type="submit" class="btn btn-primary">Done</button></div>' +
            '</form></div></div>' +
            '' +
            //'<div ng-bind-html="clean(msg)" ng-repeat="msg in snippet" class="contentRead" id="content{{$index}}"></div>' +
            '<div class="contentRead" id="content0" ng-style="content0Style">' +
            '<p style="font-size: 14px;"><b>Here are the best answers for: <i>' + question + '</i></b></p>' +
            '<div class="incDetContainer1" ng-repeat="msg in snippet | limitTo: 5">' +
            '<div id="block{{$index}}" style="height: 60px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2;-webkit-box-orient: vertical;text-overflow: ellipsis;" ng-bind-html="clean(msg)">' +
            '</div></div>' +
            '<div ng-if="snippet.length > 5" class="viewMore" style="float: right" onclick="viewMoreResults()"><a href="">View more &gt;&gt;</a></div>' +
            '<div ng-if="snippet.length <= 5" style="float: right" ng-click="showApplicationList()"><a href>Didn\'t get your answer?</a></div>';

        return html + '<input type="hidden" value="0" id="counter"/>' +
            '<input type="hidden" value="' + data.length + '" id="finalCounter"/>' +
            '<div class="pointers" style="display: none">' +
            '<span id="prev" style="cursor: pointer" onclick="clickPrevious()"> < &nbsp;&nbsp;&nbsp; </span> ' +
            '<span id="pageNumber"> 1&nbsp;/&nbsp;' + data.length + ' </span>' +
            '<span id="next" style="cursor: pointer" onclick="clickNext()"> &nbsp;&nbsp;&nbsp; > </span>' +
            '</div></div></body></html>';
    };

    //To set up the Pop up HTML for Cloudant data
    const makeIncidentTable = function (data) {
        let html = headers + scripts + style + '</head><body>' +
            '<script>const ipcr = require("electron").ipcRenderer;</script>' +
            '<div id="readingPane" ng-app="popup"><div class="heading"></div><div id="close" style="float: right; margin-right: 5px; height: 20px;"><button type="button" class="close" aria-label="Close" onclick="closeWindow()">' +
            '<span aria-hidden="true">&times;</span></button></div>' +
            '<div class="contentRead" id="content0">' +
            '<div class="container" id="incidentContainer" style="display:block"><h2>Incidents</h2>' +
            '<div class="table-responsive">' +
            '<table class="table"><thead><tr><th>#</th><th>Priority</th><th>Description</th></tr></thead><tbody>';
        let incidentCardHtml = '';
        data.forEach(d => {
            html = html + '<tr><td class="incident" id="' + d.incidentId + '" style="cursor:pointer;color:#0000EE;" onclick="showDetails(\'' + d.incidentId + '\')">' + d.incidentId + '</td><td>' + d.priority + '</td><td>' + truncate(d.incidentDesc) + '</td></tr>';
            incidentCardHtml = incidentCardHtml + '<div id="' + d.incidentId + 'container" class="incDetContainer" style="display:none">' +
                '<div class="navigation">' +
                '<div id="backButton" onclick="goBack(\'' + d.incidentId + '\')" style="marign:0;padding:0; float:left;"><img src="http://icons.iconarchive.com/icons/icons8/ios7/512/Arrows-Right-icon.png" class="backImg" alt="Back"></div>' +
                '<div id="editButton" style="padding:0;float:right;margin-right:10px;"><img src="https://cdn3.iconfinder.com/data/icons/google-material-design-icons/48/ic_mode_edit_48px-128.png" class="editImg" alt="Edit"></div></div>' +
                '<div class="card" style="width: 50rem;margin-left:20px;margin-right:20px;"><div class="card-block">' +
                '<h2 class="card-title">' + d.incidentId + '</h2>' +
                '<h4 class="card-title">' + d.applicationName + '</h4>' +
                '<h4 class="card-title">' + d.assignmentGroup + '</h4>' +
                '<p class="card-text priority"><b>' + d.priority + '</b>&nbsp;&nbsp;&nbsp;&nbsp;<b style="margin-left: 50px;">Assigned to:</b> ' + d.assignedTo + '&nbsp;&nbsp;&nbsp;&nbsp;<b style="margin-left: 50px;">Status:</b> ' + d.status + '</p>' +
                '<p class="card-text description"><b>Description:</b><br/>' + d.incidentDesc + '</p>' +
                '<p class="card-text description"><b>Work Notes:</b>' + d.workNotes.replace(/(\d{4}-\d{2}-\d{2})/g, '<br/><br/>$1') + '</p>' +
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

    function escapeSpecialCharacters(str){
        return str.replace(/\\/g, "\\\\")
            .replace(/\$/g, "\\$")
            .replace(/'/g, "\\'")
            .replace(/"/g, "\\\"");
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
            res.forEach((r, i) => {
                console.log('#######',r.metadata, r.up);
                if(!r.metadata) r.metadata = {};
                resArray.push(
                    '<p><b>' + escapeSpecialCharacters(r['Item Name']) + '</b> - <span style="color: #95d13c;"><b>'+ r.score +'</b><span></p><p style="font-size: 11px;">' + escapeSpecialCharacters(r['Documentation with HTML']) +
                    '</p><div style="display: none" id="block'+i+'feedback">' +
                    '<img id="upImage-'+i+'" value="false" answerId="'+r.id+'" appName="'+r.metadata.applicationName+'" keyword="'+data.keyword+'" question="'+data.question+'" style="float: left; border-radius:20px;" onclick="thumbsUp(this)" src="https://cdn2.iconfinder.com/data/icons/social-productivity-line-art-1/128/face-happy-48.png" height="30px;" width="30px;">' +
                    '<img id="downImage-'+i+'" value="false" answerId="'+r.id+'" appName="'+r.metadata.applicationName+'" keyword="'+data.keyword+'" style="float: right; border-radius:20px;" onclick="thumbsDown(this)" src="https://cdn2.iconfinder.com/data/icons/social-productivity-line-art-1/128/face-sad-48.png" height="30px;" width="30px;">' +
                    '</div>');
            });
            $scope.userMsg.push({"data": 'SmartBox is showing the best results now.', "class": "bot"});
            ipcRenderer.send('openPopUp', setPopUpData(resArray, data.question));
        } else if (data.type === 'cloudant') {
            $scope.userMsg.push({"data": 'SmartBox is showing the best results now.', "class": "bot"});
            ipcRenderer.send('openPopUp', makeIncidentTable(res));
        } else {
            if (isChatWindow) {
                $scope.userMsg.push({"data": res, "class": "bot"});
                if (data.event && data.event === 'closeWindow') {
                    $scope.closeChatWindow();
                }
            }
        }
    });
}]);