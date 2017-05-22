/**
 * Main process
 */
const electron = require('electron');
const {app, BrowserWindow, ipcMain, dialog} = require('electron');
const fs = require('fs');
const redis = require('./redis');
const rp = require('request-promise');

let mainWindow = null,
    popUpWindow = null,
    uploadWindow = null;

//To open the Pop up window
function openPopUpWindow(channel, html) {
    popUpWindow = new BrowserWindow({
        width: 724,
        height: 645,
        frame: false,
        show: false,
        modal: true,
        transparent: true,
        parent: mainWindow,
        alwaysOnTop: true,
        resizable: false,
        webPreferences: {
            javascript: true,
            java: false,
            directWrite: true,
            defaultEncoding: 'utf-8'
        }
    });

    popUpWindow.loadURL("data:text/html;charset=UTF-8," + html);
    popUpWindow.show();

    popUpWindow.on('closed', () => {
        console.log('closed new window');
        popUpWindow = null;
        channel.sender.send('popUpClosed', 'bye');
    });
}
//To open the main window
app.on('ready', () => {
    const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize;
    mainWindow = new BrowserWindow({
        width: 335,
        height: 70,
        x: width - 350,
        y: height - 100,
        transparent: true,
        frame: false,
        show: false,
        resizable: false,
        alwaysOnTop: true,
        title: 'SmartBot',
        webPreferences: {
            javascript: true,
            java: false,
            directWrite: true,
            defaultEncoding: 'UTF-8'
        }
    });
    fs.readFile('user.json', 'utf8', (err, data) => {
        if (err) {
            let startUpWindow = new BrowserWindow({
                width: 320,
                height: 380,
                transparent: true,
                frame: false,
                resizable: false,
                alwaysOnTop: true,
                title: 'SmartBot',
                webPreferences: {
                    javascript: true,
                    java: false,
                    directWrite: true,
                    defaultEncoding: 'UTF-8'
                }
            });
            startUpWindow.loadURL('file://' + __dirname + '/view/start.html');
        } else {
            mainWindow.loadURL('file://' + __dirname + '/view/main.html');
            mainWindow.show();
        }
    });

    ipcMain.on('openSearchBox', () => {
        mainWindow.loadURL('file://' + __dirname + '/view/main.html');
        mainWindow.show();
    });

    ipcMain.on('openPopUp', (channel, html)=> {
        if (!popUpWindow) {
            openPopUpWindow(channel, html);
        }

    });
});

app.on('window-all-closed', () => {
    //To kill the app when all the windows are closed
    app.quit();
});

ipcMain.on('exit', () => {
    console.log("exit invoked");
    app.quit();
});


//To resize the window
ipcMain.on('resize', (e, x, y) => {
    console.log("resize invoked");
    mainWindow.setSize(x, y);
});

//To set position of window
ipcMain.on('setPos', (e, x, y) => {
    mainWindow.setPosition(x, y);
});

//To resize the window along with position
ipcMain.on('resizeWithPos', (e, x, y, z) => {
    let windowPos = mainWindow.getPosition();
    mainWindow.setSize(x, y);
    if (z) {
        mainWindow.setPosition(windowPos[0], windowPos[1] + z - 75);
    } else {
        mainWindow.setPosition(windowPos[0], windowPos[1] - y + 75);
    }
});

ipcMain.on('popup-search', (e,appName, question) => {
    if(appName.split('+')[0] === 'rephrase' || appName.split('+')[0] === 'noneOfTheAbove') {
        popUpWindow.close();
    } else {
        const user = require('./user.json');
        //const user = require('./../../user.json');
        redis.set('newSearch-'+user.email,{appName: appName, question: question});
        popUpWindow.loadURL('file://' + __dirname + '/view/new-popup.html');
    }
});

ipcMain.on('upload-box', (e) => {
    let uploadWindow = new BrowserWindow({
        width: 320,
        height: 380,
        transparent: true,
        frame: false,
        resizable: false,
        parent: mainWindow,
        modal: true,
        alwaysOnTop: true,
        title: 'SmartBot',
        webPreferences: {
            javascript: true,
            java: false,
            directWrite: true,
            defaultEncoding: 'UTF-8'
        }
    });
    uploadWindow.loadURL('file://' + __dirname + '/view/upload.html');
});

ipcMain.on('startUpload', (e, appName, filePath, fileName) => {
    dialog.showMessageBox(mainWindow,{
        type:"info",
        buttons: ["Ok"],
        defaultId: 0,
        title: "Document upload",
        message: "Document upload is in progress. Meanwhile you can continue your search. You will be notified once the document is uploaded."
    },(data)=> {
        rp({
            method: 'POST',
            url: "https://smartbox-crawler.mybluemix.net/upload",
            headers: {
                'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW'
            },
            formData: {
                file: { value: fs.createReadStream(filePath),
                    options: { filename: fileName, contentType: null } },
                appName: appName
            }
        }).then(data => {
            console.log(data);
            if(data && JSON.parse(data).success){
                dialog.showMessageBox(mainWindow,{
                    type:"info",
                    buttons: ["Ok"],
                    defaultId: 0,
                    title: "Document upload",
                    message: "Document uploaded successfully."
                });
            } else {
                dialog.showMessageBox(mainWindow,{
                    type:"info",
                    buttons: ["Ok"],
                    defaultId: 0,
                    title: "Document upload",
                    message: "Document upload failed. Please try again ."
                });
            }
            //TODO: Need to handle error cases
        }).catch(err => {
            dialog.showMessageBox(mainWindow,{
                type:"info",
                buttons: ["Ok"],
                defaultId: 0,
                title: "Document upload",
                message: "Document upload failed. Please try again ."
            });
        });

    });
});



