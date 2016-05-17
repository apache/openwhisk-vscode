"use strict";

var vscode = require('vscode');
let util = require("./util.js");
let open = require("open");

var log;
var ow;
var props;

function register(_ow, context, _log, _props) {
    ow = _ow;
    log = _log;
    props = _props;
    
    var bluemixDisposable = vscode.commands.registerCommand('extension.wsk.util.bluemix', bluemixAction);
    var docsDisposable = vscode.commands.registerCommand('extension.wsk.util.docs', docsAction);
    context.subscriptions.push(bluemixDisposable, docsDisposable);
}


function bluemixAction(params) {

    log.show(true);
    log.appendLine("\n$ opening OpenWhisk console on Bluemix");
    open('https://new-console.ng.bluemix.net/openwhisk');
}

function docsAction(params) {
    log.show(true);
    log.appendLine("\n$ opening OpenWhisk console on Bluemix");
    open('https://new-console.ng.bluemix.net/docs/openwhisk/index.html');
}

module.exports = {
  register: register
};