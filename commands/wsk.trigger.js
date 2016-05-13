"use strict";

var vscode = require('vscode');
let util = require("./util.js");

var log;
var ow;

function register(_ow, context, _log) {
    ow = _ow;
    log = _log;
    
    var defaultDisposable = vscode.commands.registerCommand('extension.wsk.trigger', defaultAction);
    
    
    
	context.subscriptions.push(defaultDisposable);
}


function defaultAction(params) {
    
    log.show(true);
    log.appendLine("\n$ wsk trigger");
    log.appendLine("available commands:");
    log.appendLine("    create              create new trigger");
    log.appendLine("    update              update an existing trigger");
    log.appendLine("    fire                fire trigger event");
    log.appendLine("    get                 get trigger");
    log.appendLine("    delete              delete trigger");
    log.appendLine("    list                list all triggers");
}

function list() {
    return ow.triggers.list().then(function (triggers) {
        util.appendHeading("triggers");
        for (var x=0; x<triggers.length; x ++){
                util.appendEntry(triggers[x]);	
        }
    })
}

module.exports = {
  register: register,
  list:list
};