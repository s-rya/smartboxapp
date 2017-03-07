////////
// This sample is published as part of the blog article at www.toptal.com/blog
// Visit www.toptal.com/blog and subscribe to our newsletter to read great posts
////////

/**
 * Main process
 */
const electron = require('electron');
const {app, BrowserWindow, ipcMain} = require('electron');
const utf8 = require('utf8');

let mainWindow = null,
    insertWindow = null,
    childWindow = null;

function createInsertWindow(channel, html) {
    insertWindow = new BrowserWindow({
        width: 840,
        height: 636,
        frame: false,
        show: false,
        modal: true,
        transparent: true,
        parent: mainWindow
    });
console.log(html);
    insertWindow.loadURL("data:text/html,"+html);
    //insertWindow.loadURL('file://' + __dirname + '/test.html');
    insertWindow.once('ready-to-show', () => {
        insertWindow.show()
    });

    insertWindow.on('closed', function () {
        console.log('closed new window');
        insertWindow = null;
        channel.sender.send('popUpClosed', 'bye');
    });
}

app.on('ready', function () {
    const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize;
    mainWindow = new BrowserWindow({
        width: 350,
        height: 70,
        x: width-350,
        y: height-100,
        transparent: true,
        frame: false,
        resizable: false,
        alwaysOnTop: false,
        title: 'SmartBox',
        webPreferences: {
            javascript: true,
            java: false,
            directWrite: true
        }
    });

    mainWindow.loadURL('file://' + __dirname + '/view/main.html');

    ipcMain.on('openPopUp', function (channel, html) {
        if (!insertWindow) {
            createInsertWindow(channel, html);
        }

        //return (!insertWindow.isclosed() && insertWindow.isVisible()) ? insertWindow.hide() : insertWindow.show();
    });
});

app.on('window-all-closed', function () {
    //To kill the app when all the windows are closed
    app.quit();
});

ipcMain.on('resize', function (e, x, y) {
    console.log("resize invokded");
    mainWindow.setSize(x, y);
    //mainWindow.setPosition(1000, 250)
});

ipcMain.on('setPos', function (e, x, y) {
    mainWindow.setPosition(x, y);
});


ipcMain.on('resizeWithPos', (e, x, y, z) => {
    let windowPos = mainWindow.getPosition();
    mainWindow.setSize(x, y);
    if(z) {
        mainWindow.setPosition(windowPos[0], windowPos[1] + z - 75);
    } else {
        mainWindow.setPosition(windowPos[0], windowPos[1] - y + 75);
    }
});


