var app = require('app'); // Module to control application life.
var ipc = require('ipc');
var BrowserWindow = require('browser-window'); // Module to create native browser window.
var GlobalShortcut = require('global-shortcut');
var dialog = require('dialog');

var proxy = require('./proxy');

// Report crashes to our server.
require('crash-reporter').start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
var mainWindow = null;
var dialogWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    app.quit();
});


// This method will be called when Electron has done everything
// initialization and ready for creating browser windows.
app.on('ready', function() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 980,
        height: 600,
        preload: true
    });

    var clearRequestData = function() {
        GLOBAL.recorder.recordBodyMap = [];
        mainWindow.webContents.send('clearRequestData');
    };

    GlobalShortcut.register('Control+x', function() {
        console.log('Control+x is pressed');
        clearRequestData();
    });

    // GlobalShortcut.register('CmdOrCtrl+Alt+i', function() {
    //     console.log('CmdOrCtrl+Alt+i is pressed');
    // });

    ipc.on('main:clearRequestData', function(event) {
        clearRequestData();
    });

    // and load the index.html of the app.
    mainWindow.loadUrl('file://' + __dirname + '/index.html');

    // Open the devtools.
    // mainWindow.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
        dialogWindow = null;
    });

    var sender;
    ipc.on('main:ready', function(event) {
        if(!sender) {
            sender = event.sender;
        }
    });

    mainWindow.on('resize', function() {
        if(sender) {
            sender.send('main:resize');
        }
    });

    dialogWindow = new BrowserWindow({
        width: 250,
        height: 280,
        center: true,
        show: false,
        resizable: false,
        fullscreen: false,
        title: 'Scan QR Code',
        'always-on-top': true,
        'use-content-size': false
    });

    dialogWindow.loadUrl('file://' + __dirname + '/qrcode.html');

    ipc.on('main:showQRCodeDialog', function() {
        dialogWindow.show();
    });

    dialogWindow.on('close', function(event) {
        event.preventDefault();
        dialogWindow.hide();
    });
});