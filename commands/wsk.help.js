"use strict";

var vscode = require('vscode');

var log;
var ow;
var props;

function register(_ow, context, _log, _props) {
    ow = _ow;
    log = _log;
    props = _props;
    
    var disposable = vscode.commands.registerCommand('extension.wsk.help', defaultAction);
	context.subscriptions.push(disposable);
}

function defaultAction(params) {
    
    log.show(true);
    log.appendLine("\n$ wsk help");
    log.appendLine("available commands:");
    log.appendLine("     bluemix             launch OpenWhisk console on Bluemix");
    log.appendLine("     docs                open OpenWhisk docs");
    log.appendLine("     property set        set property");
    log.appendLine("     property unset      unset property");
    log.appendLine("     property get        get property");
    log.appendLine("     action              see available commands for OpenWhisk actions");
}

module.exports = {
  register: register
};