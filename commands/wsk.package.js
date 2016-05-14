"use strict";

var vscode = require('vscode');
let util = require("./util.js");

var log;
var ow;

function register(_ow, context, _log) {
    ow = _ow;
    log = _log;
    
    var defaultDisposable = vscode.commands.registerCommand('extension.wsk.package', defaultAction);
    context.subscriptions.push(defaultDisposable);
}


function defaultAction(params) {
    log.show(true);
    log.appendLine("\n$ wsk package");
    log.appendLine("available commands:");
    log.appendLine("    create              create a new package");
    log.appendLine("    update              create a new package");
    log.appendLine("    bind                bind parameters to the package");
    log.appendLine("    refresh             refresh package bindings");
    log.appendLine("    get                 get package");
    log.appendLine("    delete              delete package");
    log.appendLine("    list                list all packages");
}

function list() {
    return ow.packages.list().then(function (packages) {
        util.appendHeading("packages");
        for (var x=0; x<packages.length; x ++){
                util.appendEntry(packages[x]);	
        }
    }).catch(function(error) {
        log.appendLine(error.toString())
    });
}

module.exports = {
  register: register,
  list:list
};