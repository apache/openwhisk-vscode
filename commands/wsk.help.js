"use strict";

var vscode = require('vscode');

var log;
var ow;

function register(_ow, context, _log) {
    ow = _ow;
    log = _log;
    
    var disposable = vscode.commands.registerCommand('extension.wsk.help', defaultAction);
	context.subscriptions.push(disposable);
}

function defaultAction(params) {
    
    log.show(true);
    log.appendLine("\n$ wsk help");
    log.appendLine("not implemented yet, but it will be!");
}

module.exports = {
  register: register
};