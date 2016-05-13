"use strict";

var vscode = require('vscode');
let util = require("./util.js");
let fs = require('fs');

var importDirectory = '/wsk-import/';

var log;
var ow;
var actions = [];

function register(_ow, context, _log) {
    ow = _ow;
    log = _log;
    
    var defaultDisposable = vscode.commands.registerCommand('extension.wsk.action', defaultAction);
    var listDisposable = vscode.commands.registerCommand('extension.wsk.action.list', listAction);
    var invokeDisposable = vscode.commands.registerCommand('extension.wsk.action.invoke', invokeAction);
    var createDisposable = vscode.commands.registerCommand('extension.wsk.action.create', createAction);
    var updateDisposable = vscode.commands.registerCommand('extension.wsk.action.update', updateAction);
    var deleteDisposable = vscode.commands.registerCommand('extension.wsk.action.delete', deleteAction);
    var getDisposable = vscode.commands.registerCommand('extension.wsk.action.get', getAction);
    var newDisposable = vscode.commands.registerCommand('extension.wsk.action.new', newAction);
	context.subscriptions.push(defaultDisposable, listDisposable, invokeDisposable, createDisposable, updateDisposable, deleteDisposable, getDisposable, newDisposable);
}

function defaultAction(params) {
        
    log.show(true);
    log.appendLine("\n$ wsk action");
    log.appendLine("available commands:");
    log.appendLine("     new                 create new action boilerplate file");
    log.appendLine("     create              create new action");
    log.appendLine("     update              update an existing action");
    log.appendLine("     invoke              invoke action");
    log.appendLine("     get                 get action");
    log.appendLine("     delete              delete action");
    log.appendLine("     list                list all actions");
}

function listAction(params) {
        
    log.show(true);
    log.appendLine("\n$ wsk action list");
    list();
}

function list() {
    return getList().then(function (actions) {
        util.appendHeading("actions");
        for (var x=0; x<actions.length; x ++){
                util.appendEntry(actions[x]);	
        }
    })
}

function getList() {
    return new Promise(function (fulfill, reject){
        return ow.actions.list().then(function (_actions) {
            actions = _actions;
            fulfill(actions);
        });
    });
}

function getListAsStringArray() {
    return getList().then(function (actions) {
        var result = [];
        for (var x=0; x<actions.length; x ++){
            var actionName = util.formatQualifiedName(actions[x]);
            result.push(actionName)	
        }
        return result;
    })
}

function invokeAction(params) {
        
    
    vscode.window.showQuickPick( getListAsStringArray(), {placeholder:"enter an action name"}).then( function (action) {
        
        if (action == undefined) {
            return;
        }
        
        var actionString = action.toString();
        var startIndex = actionString.indexOf("/");
        var namespace = actionString.substring(0, startIndex);
        var actionToInvoke = actionString.substring(startIndex+1);
        
    log.show(true);
        log.appendLine("\n$ wsk action invoke " + actionToInvoke);
        
        var activityInterval = setInterval(function() {
            log.append(".");
        },300);
        
        //todo: handle errors inside of actions and log statements...
        
        var startTime = new Date().getTime();
        ow.actions.invoke({
            actionName: actionToInvoke,
            blocking:true,
            namespace: namespace
        }).then(function(result) {
            var totalTime = startTime - (new Date().getTime());
            clearInterval(activityInterval);
            log.appendLine("\n"+JSON.stringify(result.response, null, 4));
            log.appendLine(">> completed in " + (-totalTime) + "ms");
        });
    });
}



function createAction(params) {
        
    
    if (vscode.window.activeTextEditor == undefined || 
    vscode.window.activeTextEditor.document == undefined) {
        vscode.window.showWarningMessage('Must have a document open for editing.  The currently focused document will be used to create the OpenWhisk action.');
        return;
    }
    
    vscode.window.showInputBox({prompt:"Enter a name for your action:"})
    .then(function(action){
        
        if (action == undefined) {
            return;
        }
        
        log.show(true);
        log.appendLine("\n$ wsk action create " + action);
    
        log.appendLine("Creating a new action using the currently open document: " + vscode.window.activeTextEditor.document.uri);
        
        var options = {
            actionName: action, 
            action: vscode.window.activeTextEditor.document.getText()
        };
        
        var swiftExt = ".swift";
        var lastIndex = vscode.window.activeTextEditor.document.uri.fsPath.lastIndexOf(swiftExt);
        if (lastIndex == vscode.window.activeTextEditor.document.uri.fsPath.length - swiftExt.length) {
            //it's a swift file, handle it differently
            options.action = { exec: { kind: 'swift:3', code: options.action }}
        }
        
        ow.actions.create(options)
        .then(function(result) {
            log.appendLine("OpenWhisk action created: " + util.formatQualifiedName(result));
            vscode.window.showInformationMessage("OpenWhisk action created: " + util.formatQualifiedName(result));
        });
    });
    
}

function updateAction(params) {
          
    
    if (vscode.window.activeTextEditor == undefined || 
    vscode.window.activeTextEditor.document == undefined) {
        vscode.window.showWarningMessage('Must have a document open for editing.  The currently focused document will be used to create the OpenWhisk action.');
        return;
    }
    
    vscode.window.showQuickPick(getListAsStringArray(), {prompt:"Select an action to update:"})
    .then(function(action){
        
        if (action == undefined) {
            return;
        }
        
        var actionString = action.toString();
        var startIndex = actionString.indexOf("/");
        var namespace = actionString.substring(0, startIndex);
        var actionToUpdate = actionString.substring(startIndex+1);
        
        log.show(true);
        log.appendLine("\n$ wsk action update " + actionToUpdate);
    
        log.appendLine("Creating a new action using the currently open document: " + vscode.window.activeTextEditor.document.uri);
        
        var options = {
            actionName: actionToUpdate, 
            action: vscode.window.activeTextEditor.document.getText()
        };
        
        var swiftExt = ".swift";
        var lastIndex = vscode.window.activeTextEditor.document.uri.fsPath.lastIndexOf(swiftExt);
        if (lastIndex == vscode.window.activeTextEditor.document.uri.fsPath.length - swiftExt.length) {
            //it's a swift file, handle it differently
            options.action = { exec: { kind: 'swift:3', code: options.action }}
        }
        
        ow.actions.update(options)
        .then(function(result) {
            log.appendLine("OpenWhisk action updated: " + util.formatQualifiedName(result));
            vscode.window.showInformationMessage("OpenWhisk action updated: " + util.formatQualifiedName(result));
        });
    });
}

function deleteAction(params) {
        vscode.window.showQuickPick(getListAsStringArray(), {prompt:"Select an action to delete:"})
    .then(function(action){
        
        if (action == undefined) {
            return;
        }
        
        var actionString = action.toString();
        var startIndex = actionString.indexOf("/");
        var namespace = actionString.substring(0, startIndex);
        var actionToDelete = actionString.substring(startIndex+1);
        
        log.show(true);
        log.appendLine("\n$ wsk action update " + actionToDelete);
    
        var options = {
            actionName: actionToDelete
        };
        
        var YES = "Yes";
        var NO = "No";
        
        vscode.window.showWarningMessage("Are you sure you want to delete " + actionToDelete, YES, NO)
        .then( function(selection) {
            if (selection === YES) {
                ow.actions.delete(options)
                .then(function(result) {
                    console.log(result);
                    log.appendLine("OpenWhisk action deleted: " + util.formatQualifiedName(result));
                    vscode.window.showInformationMessage("OpenWhisk action updated: " + util.formatQualifiedName(result));
                });
            }
        });
        
    });
}

function getAction(params) {
        
    //todo: determine between sequences and specific actions.  right now both are treated teh same
    
    
    vscode.window.showQuickPick( getListAsStringArray(), {prompt:"Select an action to retrieve:"}).then( function (action) {
        
        if (action == undefined) {
            return;
        }
        
        var actionString = action.toString();
        var startIndex = actionString.indexOf("/");
        var namespace = actionString.substring(0, startIndex);
        var actionToGet = actionString.substring(startIndex+1);
        
        log.show(true);
        log.appendLine("\n$ wsk action get " + actionToGet);
        
        var activityInterval = setInterval(function() {
            log.append(".");
        },300);
        
        var startTime = new Date().getTime();
        ow.actions.get({
            actionName: actionToGet,
            blocking:true,
            namespace: namespace
        }).then(function(result) {
            var totalTime = startTime - (new Date().getTime());;
            clearInterval(activityInterval);
            log.appendLine(">> completed in " + (-totalTime) + "ms")
            
            //console.log(vscode.workspace.rootPath);
            
            //todo: check if file exists before writing
            //todo: make sure use has selected a directory to import into
            
            var buffer = new Buffer(result.exec.code);
            var fileName = result.name;
            if (result.exec.kind.toString().search("swift") >= 0) {
                fileName += ".swift"
            } else {
                fileName += ".js"
            }
            var path = vscode.workspace.rootPath + importDirectory
            
            if (!fs.existsSync(path)){
                fs.mkdirSync(path);
            }

            path += fileName;

            fs.open(path, 'w', function(err, fd) {
                if (err) {
                    throw 'error opening file: ' + err;
                }

                fs.write(fd, buffer, 0, buffer.length, null, function(err) {
                    if (err) throw 'error writing file: ' + err;
                    fs.close(fd, function() {
                        //console.log('file written');
                        
                        vscode.workspace.openTextDocument(path)
                        .then(function(document) {
                            //console.log(document)
                            vscode.window.showTextDocument(document);
                            vscode.window.showInformationMessage('Successfully imported ' + importDirectory + fileName);
                            log.appendLine('Successfully imported file to ' + path);
                        });
                        
                    })
                });
            });
        });
    });
}


function newAction(params) {
       
    
    vscode.window.showQuickPick( ["Node.js", "Swift"], {prompt:"Select the type of action:"}).then( function (action) {
        
        if (action == undefined) {
            return;
        }
        
        var template = "";
        if (action == "Node.js") {
            template = nodeTemplate;
        } else {
            template = swiftTemplate;
        }
        
        log.show(true);
        log.appendLine("\n$ wsk action new:" + action);
        
        //todo: make it look for unique names or prompt for name
            
            var buffer = new Buffer(template);
            var fileName = "newAction";
            if (action == "Node.js") {
                fileName += ".js"
            } else {
                fileName += ".swift"
            }
            
            var path = vscode.workspace.rootPath + importDirectory
            
            if (!fs.existsSync(path)){
                fs.mkdirSync(path);
            }

            path += fileName;

            fs.open(path, 'w', function(err, fd) {
                if (err) {
                    throw 'error opening file: ' + err;
                }

                fs.write(fd, buffer, 0, buffer.length, null, function(err) {
                    if (err) throw 'error writing file: ' + err;
                    fs.close(fd, function() {
                        //console.log('file written');
                        
                        vscode.workspace.openTextDocument(path)
                        .then(function(document) {
                            //console.log(document)
                            vscode.window.showTextDocument(document);
                            log.appendLine('Created new action using ' + action + ' template');
                        });
                        
                    })
                });
            });
    });
}



let nodeTemplate = "var request = require('request');\n" +
    "\n" +
    "function main(msg) {\n" +
    "    var url = 'https://httpbin.org/get';\n" +
    "    request.get(url, function(error, response, body) {\n" +
    "        whisk.done({msg: body});\n" +
    "    });\n" +
    "    return whisk.async();\n" +
    "}\n";


let swiftTemplate = "/**\n" + 
    " * Sample code using the experimental Swift 3 runtime\n" + 
    " * with links to KituraNet and GCD\n" + 
    " */\n" + 
    "\n" + 
    "import KituraNet\n" + 
    "import Dispatch\n" + 
    "import Foundation\n" + 
    "\n" + 
    "func main(args:[String:Any]) -> [String:Any] {\n" + 
    "\n" + 
    "    // Force KituraNet call to run synchronously on a global queue\n" + 
    "    var str = \"No response\"\n" + 
    "    dispatch_sync(dispatch_get_global_queue(0, 0)) {\n" + 
    "\n" + 
    "            Http.get(\"https://httpbin.org/get\") { response in\n" + 
    "\n" + 
    "                do {\n" + 
    "                   str = try response!.readString()!\n" + 
    "                } catch {\n" + 
    "                    print(\"Error \(error)\")\n" + 
    "                }\n" + 
    "\n" + 
    "            }\n" + 
    "    }\n" + 
    "\n" + 
    "    // Assume string is JSON\n" + 
    "    print(\"Got string \(str)\")\n" + 
    "    var result:[String:Any]?\n" + 
    "\n" + 
    "    // Convert to NSData\n" + 
    "    let data = str.bridge().dataUsingEncoding(NSUTF8StringEncoding)!\n" + 
    "    do {\n" + 
    "        result = try NSJSONSerialization.jsonObject(with: data, options: []) as? [String: Any] + \n" + 
    "    } catch {\n" + 
    "        print(\"Error \(error)\")\n" + 
    "    }\n" + 
    "\n" + 
    "    // return, which should be a dictionary\n" + 
    "    print(\"Result is \(result!)\")\n" + 
    "    return result!\n" + 
    "}\n";


module.exports = {
  register: register,
  list:list
};