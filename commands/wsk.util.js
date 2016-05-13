"use strict";

var vscode = require('vscode');
let util = require("./util.js");
let open = require("open");

var log;
var ow;

function register(_ow, context, _log) {
    ow = _ow;
    log = _log;
    
    var bluemixDisposable = vscode.commands.registerCommand('extension.wsk.util.bluemix', bluemixAction);
    context.subscriptions.push(bluemixDisposable);
}


function bluemixAction(params) {

    log.show(true);
    log.appendLine("\n$ opening OpenWhisk console on Bluemix");
    open('https://new-console.ng.bluemix.net/openwhisk');
}

module.exports = {
  register: register
};