/**
 * Main process
 */
const electron = require('electron');
const {app, BrowserWindow, ipcMain} = require('electron');
const fs = require('fs');
const redis = require('./redis');

let mainWindow = null,
    popUpWindow = null;

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
        title: 'SmartBox',
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
                title: 'SmartBox',
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
    const user = require('./user.json');
    //const user = require('./../../user.json');
    redis.set('newSearch-'+user.email,{appName: appName, question: question});
    popUpWindow.loadURL('file://' + __dirname + '/view/new-popup.html');
});
