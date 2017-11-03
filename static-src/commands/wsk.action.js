/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var vscode = require('vscode');
let util = require('./util.js');
let fs = require('fs');
let spawn = require('child_process').spawn;


var importDirectory = '/wsk-import/';

var log;
var ow;
var actions = [];
var props;
var context


//supported OpenWhisk file formats
var NODE = 'JavaScript',
    NODE6 = 'JavaScript 6',
    PHP = 'PHP',
    PYTHON = 'Python',
    SWIFT = 'Swift';

var sequenceComplete = {
                description:'',
                detail:'Sequence Complete - select this option to complete the sequence.  No additional action will be added to the sequence.',
                label:'-- No Action --',
            }//'--- - Sequence Complete ---';

function register(_ow, _context, _log, _props) {
    ow = _ow;
    log = _log;
    props = _props;
    context = _context

    var defaultDisposable = vscode.commands.registerCommand('extension.wsk.action', defaultAction);
    var listDisposable = vscode.commands.registerCommand('extension.wsk.action.list', listAction);
    var invokeDisposable = vscode.commands.registerCommand('extension.wsk.action.invoke', invokeAction);
    var debugDisposable = vscode.commands.registerCommand('extension.wsk.action.debug', debugAction);
    var createDisposable = vscode.commands.registerCommand('extension.wsk.action.create', createAction);
    var updateDisposable = vscode.commands.registerCommand('extension.wsk.action.update', updateAction);
    var deleteDisposable = vscode.commands.registerCommand('extension.wsk.action.delete', deleteAction);
    var getDisposable = vscode.commands.registerCommand('extension.wsk.action.get', getAction);
    var initDisposable = vscode.commands.registerCommand('extension.wsk.action.init', initAction);
    var restDisposable = vscode.commands.registerCommand('extension.wsk.action.rest', restAction);
    var createSequenceDisposable = vscode.commands.registerCommand('extension.wsk.action.sequence.create', createSequenceAction);

    context.subscriptions.push(defaultDisposable, listDisposable, invokeDisposable, debugDisposable, createDisposable, updateDisposable, deleteDisposable, getDisposable, initDisposable, createSequenceDisposable, restDisposable);
}

function defaultAction(params) {

    log.show(true);
    log.appendLine('\n$ wsk action');
    log.appendLine('available commands:');
    log.appendLine('     init                create new action boilerplate file');
    log.appendLine('     create              create new action');
    log.appendLine('     sequence            create a new sequence of actions');
    log.appendLine('     update              update an existing action');
    log.appendLine('     invoke              invoke action');
    log.appendLine('     get                 get action');
    log.appendLine('     delete              delete action');
    log.appendLine('     list                list all actions');
    log.appendLine('     rest                display CURL rest invocation parameters');
}

function listAction(params) {

    if (!props.validate()){
        return;
    }

    log.show(true);
    log.appendLine('\n$ wsk action list');
    list();
}

function list() {
    return getList().then(function (actions) {
        util.appendHeading('actions');
        for (var x=0; x<actions.length; x ++){
                util.appendEntry(actions[x]);
        }
    }).catch(function(error) {
        util.printOpenWhiskError(error);
    });
}

function getList() {
    return new Promise(function (fulfill, reject){
        return ow.actions.list().then(function (_actions) {
            actions = _actions;
            fulfill(actions);
        }).catch(function(error) {
            log.appendLine(error.toString())
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

function getListAsStringArrayForSequenceDialog(firstCall) {
    return getListAsStringArray().then(function (actions) {
        if (firstCall !== true ) {
            actions.unshift(sequenceComplete)
        }
        return actions;
    })
}

function invokeAction(params) {

    if (!props.validate()){
        return;
    }

    selectActionAndRequestParameters( function(namespace, actionToInvoke, parametersString) {

        log.show(true);
        log.appendLine('\n$ wsk action invoke ' + actionToInvoke + ' ' + parametersString);

        var activityInterval = setInterval(function() {
            log.append('.');
        },300);

        var startTime = new Date().getTime();
        var invocationParams = {
            actionName: actionToInvoke,
            blocking:true,
            namespace: namespace
        }

        if (parametersString.length>0) {
            invocationParams.params = util.parseParametersString(parametersString);
        }
        ow.actions.invoke(invocationParams)
        .then(function(result) {
            var totalTime = startTime - (new Date().getTime());
            clearInterval(activityInterval);
            log.appendLine('\n'+JSON.stringify(result.response, null, 4));
            log.appendLine('>> completed in ' + (-totalTime) + 'ms');
        })
        .catch(function(error) {
            clearInterval(activityInterval);
            util.printOpenWhiskError(error);
        });

    })
}


function selectActionAndRequestParameters(callback) {

    vscode.window.showQuickPick( getListAsStringArray(), {placeHolder:'Select an action.'}).then( function (action) {

        if (action == undefined) {
            return;
        }

        var actionString = action.toString();
        var startIndex = actionString.indexOf('/');
        var namespace = actionString.substring(0, startIndex);
        var actionToInvoke = actionString.substring(startIndex+1);

        vscode.window.showInputBox({
            placeHolder:'Enter parameters list (-p key value) or leave blank for no parameters:',
            value:props.get(actionToInvoke)
        }).then(function (parametersString) {

            var pString = ''
            if (parametersString != undefined) {
                pString = parametersString
            }

            props.set(actionToInvoke, pString, true);

            callback( namespace, actionToInvoke, parametersString )
        });
    });

}


var wskdb = undefined;
function debugAction(params) {

    if (!props.validate()){
        return;
    }
    selectActionAndRequestParameters( function(namespace, actionToInvoke, parametersString) {

        wskdb = spawn('wskdb', []);
        wskdb.stdout.setEncoding('utf-8');
        wskdb.stdin.setEncoding('utf-8');

        wskdb.on('error', (error) => {
            console.error(error);
            log.appendLine("Unable to invoke the wskdb debugger.  Please make sure that you have it installed.");
        })

        wskdb.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
            log.appendLine("ERROR:" + data.toString())
            wskdb.kill();
        });

        wskdb.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
            wskdb = undefined;
        });

        var OK = /ok[\n|.*]*?\(wskdb\)/;
        var ERROR = /^Error\:/;

        var exit = function() {
            wskdb.stdout.removeAllListeners("data")
            wskdb.stdin.write("exit\n");
        }

        var attachDebugger = function() {
            log.appendLine('\n$ attaching wskdb to ' + actionToInvoke);

            wskdb.stdout.removeAllListeners("data")
            wskdb.stdin.write("attach " + actionToInvoke + "\n");

            var stdoutData;
            wskdb.stdout.on('data', (data) => {
                //console.log(`stdout: ${data}`);

                if (stdoutData == undefined) {
                    stdoutData = data;
                } else {
                    stdoutData += data;
                }

                var str = data.toString();
                if (stdoutData.match(OK)) {
                    invokeAction();
                } else if (stdoutData.match(ERROR)) {
                    log.appendLine(str);
                    exit();
                }
            });
        }

        var invokeAction = function() {

            log.appendLine('$ invoking wskdb with ' + actionToInvoke + ' ' + parametersString);
            wskdb.stdout.removeAllListeners("data")
            var stdinData = "invoke " + actionToInvoke + ' ' + parametersString;
            wskdb.stdin.write(stdinData + "\n");

            var stdoutData;
            var wroteOutput = false;

            wskdb.stdout.on('data', (data) => {
                //console.log(`stdout: ${data}`);

                var str = data.toString();

                if (stdoutData == undefined) {
                    stdoutData = data;
                } else {
                    stdoutData += data;
                }

                //clean garbage that sometimes gets shoved into stdout when writing to stdin
                if (stdoutData.indexOf(stdinData) >= 0) {
                    stdoutData = stdoutData.substring( stdoutData.indexOf(stdinData)+stdinData.length+1 )
                }

                //if contains a complete json doc, print it
                if (stdoutData.match(/{([^}]*)}/) && !wroteOutput) {
                    var outString = stdoutData.substring(stdoutData.indexOf("{"))
                    outString = outString.substring(0, outString.lastIndexOf("}")+1);
                    log.appendLine(outString);
                    wroteOutput = true
                }

                if (stdoutData.match(OK)) {
                    exit();
                } else if (stdoutData.match(ERROR)) {
                    log.appendLine(str);
                    exit();
                }
            });
        }

        log.show(true);
        attachDebugger();

    });
}



function createAction(params) {

    if (!props.validate()){
        return;
    }

    if (vscode.window.activeTextEditor == undefined || vscode.window.activeTextEditor.document == undefined) {
        vscode.window.showWarningMessage('Must have a document open for editing.  The currently focused document will be used to create the OpenWhisk action.');
        return;
    }

    vscode.window.showInputBox({placeHolder:'Enter a name for your action:'})
    .then(function(action){

        if (action == undefined) {
            return;
        }

        log.show(true);
        log.appendLine('\n$ wsk action create ' + action);

        log.appendLine('Creating a new action using the currently open document: ' + vscode.window.activeTextEditor.document.uri);

        var options = {
            actionName: action,
            action: vscode.window.activeTextEditor.document.getText()
        };

        var swiftExt = '.swift';
        var pyExt = '.py';
        var phpExt = '.php';
        var lastIndex = vscode.window.activeTextEditor.document.uri.fsPath.lastIndexOf(swiftExt);
        if (lastIndex == vscode.window.activeTextEditor.document.uri.fsPath.length - swiftExt.length) {
            options.action = { exec: { kind: 'swift:3', code: options.action }}
        } else {

            lastIndex = vscode.window.activeTextEditor.document.uri.fsPath.lastIndexOf(pyExt);
            if (lastIndex == vscode.window.activeTextEditor.document.uri.fsPath.length - pyExt.length) {
                options.action = { exec: { kind: 'python:3', code: options.action }}
            }else {
                lastIndex = vscode.window.activeTextEditor.document.uri.fsPath.lastIndexOf(phpExt);
                if (lastIndex == vscode.window.activeTextEditor.document.uri.fsPath.length - phpExt.length) {
                    options.action = { exec: { kind: 'php:7.1', code: options.action }}
                }else {
                    options.action = { exec: { kind: 'nodejs:6', code: options.action }}
                }
            }
        }

        ow.actions.create(options)
        .then(function(result) {
            log.appendLine('OpenWhisk action created: ' + util.formatQualifiedName(result));
            vscode.window.showInformationMessage('OpenWhisk action created: ' + util.formatQualifiedName(result));
        })
        .catch(function(error) {
            util.printOpenWhiskError(error);
        });
    });

}

function updateAction(params) {

    if (!props.validate()){
        return;
    }

    if (vscode.window.activeTextEditor == undefined || vscode.window.activeTextEditor.document == undefined) {
        vscode.window.showWarningMessage('Must have a document open for editing.  The currently focused document will be used to create the OpenWhisk action.');
        return;
    }

    var YES = 'Yes';
    var NO = 'No';

    vscode.window.showQuickPick(getListAsStringArray(), {placeHolder:'Select an action to update:'})
    .then(function(action){

        if (action == undefined) {
            return;
        }

        vscode.window.showWarningMessage('Are you sure you want to overwrite ' + action, YES, NO)
        .then( function(selection) {
            if (selection === YES) {

                var actionString = action.toString();
                var startIndex = actionString.indexOf('/');
                var namespace = actionString.substring(0, startIndex);
                var actionToUpdate = actionString.substring(startIndex+1);

                log.show(true);
                log.appendLine('\n$ wsk action update ' + actionToUpdate);

                log.appendLine('Updating action ' + actionToUpdate + ' using the currently open document: ' + vscode.window.activeTextEditor.document.uri);

                var options = {
                    actionName: actionToUpdate,
                    action: vscode.window.activeTextEditor.document.getText()
                };

                var swiftExt = '.swift';
                var pyExt = '.py';
                var phpExt = '.php';
                var lastIndex = vscode.window.activeTextEditor.document.uri.fsPath.lastIndexOf(swiftExt);
                if (lastIndex == vscode.window.activeTextEditor.document.uri.fsPath.length - swiftExt.length) {
                    options.action = { exec: { kind: 'swift:3', code: options.action }}
                } else {

                    lastIndex = vscode.window.activeTextEditor.document.uri.fsPath.lastIndexOf(pyExt);
                    if (lastIndex == vscode.window.activeTextEditor.document.uri.fsPath.length - pyExt.length) {
                        options.action = { exec: { kind: 'python:3', code: options.action }}
                    }else {
                        lastIndex = vscode.window.activeTextEditor.document.uri.fsPath.lastIndexOf(phpExt);
                        if (lastIndex == vscode.window.activeTextEditor.document.uri.fsPath.length - phpExt.length) {
                            options.action = { exec: { kind: 'php:7.1', code: options.action }}
                        }else {
                            options.action = { exec: { kind: 'nodejs:6', code: options.action }}
                        }
                    }
                }

                ow.actions.update(options)
                .then(function(result) {
                    var message = 'OpenWhisk action updated: ' + util.formatQualifiedName(result)
                    log.appendLine(message);
                    vscode.window.showInformationMessage(message);
                })
                .catch(function(error) {
                    util.printOpenWhiskError(error);
                });
            }
        });
    });
}

function createSequenceAction(params) {

    if (!props.validate()){
        return;
    }

    vscode.window.showInputBox({placeHolder:'Enter a name for your action:'})
    .then(function(action){

        if (action == undefined) {
            return;
        }

        //first get the pipe action, so we can create the sequence action
        ow.actions.get({
            actionName: 'system/pipe',
            blocking:true,
            namespace: 'whisk.system'
        }).then(function(result) {

            console.log(result);
            var pipeCode = result.exec.code;

            log.show(true);
            log.appendLine('\n$ wsk action create ' + action + ' --sequence');

            var sequenceActions = [];

            var selectSequenceActions = function(firstCall) {

                vscode.window.showQuickPick(getListAsStringArrayForSequenceDialog(firstCall), {placeHolder:`Select action #${(sequenceActions.length+1)} for the sequence.`})
                .then(function(selectedActionStep){

                    if (selectedActionStep == undefined) {
                        log.appendLine('cancelled by user ESC');
                        return;
                    }
                    else if (selectedActionStep != sequenceComplete) {

                        sequenceActions.push('/'+selectedActionStep);
                        selectSequenceActions(false);
                    }
                    else {
                        //sequence complete
                        if (sequenceActions.length > 0) {

                            var options = {
                                actionName: action,
                                action: { exec: { kind: 'nodejs:6', code: pipeCode },
                                parameters:[{
                                        'key': '_actions',
                                        'value': sequenceActions
                                    }]
                                }
                            };

                            ow.actions.create(options)
                            .then(function(result) {
                                var message = 'OpenWhisk sequence created: ' + util.formatQualifiedName(result);
                                log.appendLine(message);
                                vscode.window.showInformationMessage(message);
                            })
                            .catch(function(error) {
                                util.printOpenWhiskError(error);
                            });
                        }
                    }
                });
            }

            selectSequenceActions(true);



        });
    });
}

function deleteAction(params) {

    if (!props.validate()){
        return;
    }

    vscode.window.showQuickPick(getListAsStringArray(), {placeHolder:'Select an action to delete:'})
    .then(function(action){

        if (action == undefined) {
            return;
        }

        var actionString = action.toString();
        var startIndex = actionString.indexOf('/');
        var namespace = actionString.substring(0, startIndex);
        var actionToDelete = actionString.substring(startIndex+1);

        log.show(true);
        log.appendLine('\n$ wsk action delete ' + actionToDelete);

        var options = {
            actionName: actionToDelete
        };

        var YES = 'Yes';
        var NO = 'No';

        vscode.window.showWarningMessage('Are you sure you want to delete ' + actionToDelete, YES, NO)
        .then( function(selection) {
            if (selection === YES) {
                ow.actions.delete(options)
                .then(function(result) {
                    console.log(result);
                    log.appendLine('OpenWhisk action deleted: ' + util.formatQualifiedName(result));
                    vscode.window.showInformationMessage('OpenWhisk action deleted: ' + util.formatQualifiedName(result));
                })
                .catch(function(error) {
                    util.printOpenWhiskError(error);
                });
            }
        });
    });
}

function getAction(params) {

    if (!props.validate()){
        return;
    }

    if (!hasValidProjectRoot()) {
        return;
    }

    vscode.window.showQuickPick( getListAsStringArray(), {placeHolder:'Select an action to retrieve:'}).then( function (action) {

        if (action == undefined) {
            return;
        }

        var actionString = action.toString();
        var startIndex = actionString.indexOf('/');
        var namespace = actionString.substring(0, startIndex);
        var actionToGet = actionString.substring(startIndex+1);

        log.show(true);
        log.appendLine('\n$ wsk action get ' + actionToGet);

        var activityInterval = setInterval(function() {
            log.append('.');
        },300);

        var startTime = new Date().getTime();
        ow.actions.get({
            actionName: actionToGet,
            blocking:true,
            namespace: namespace
        }).then(function(result) {
            var totalTime = startTime - (new Date().getTime());;
            clearInterval(activityInterval);
            log.appendLine('>> completed in ' + (-totalTime) + 'ms')

            if (isSequence(result)) {
                var message = actionToGet + ' is a sequence.  It cannot be edited directly, and has not be written to a file.';
                log.appendLine(message)
                vscode.window.showWarningMessage(message);
                log.appendLine('You can edit these individual sequence actions: ');
                for (var x=0; x < result.parameters.length; x ++){
                    var param =  result.parameters[x];
                    if (param.key == '_actions') {
                        for (var y=0; y < param.value.length; y ++){
                            log.appendLine('  >  ' + param.value[y])
                        }
                    }
                }
            }
            else {
                log.appendLine(JSON.stringify(result,  null, 4))
                //todo: check if file exists before writing
                //todo: make sure user has selected a directory to import into

                var buffer = new Buffer(result.exec.code);
                var fileName = result.name;

                var fileExt = '';
                if (result.exec.kind.toString().search('swift') >= 0) {
                    fileName += '.swift'
                } else if (result.exec.kind.toString().search('python') >= 0) {
                    fileName += '.py'
                } else {
                    fileName += '.js'
                }

                var path = vscode.workspace.rootPath + importDirectory

                if (!fs.existsSync(path)){
                    fs.mkdirSync(path);
                }

                var filePath = getUniqueFilename(path, fileName, fileExt);

                fs.open(filePath, 'w', function(err, fd) {
                    if (err) {
                        throw 'error opening file: ' + err;
                    }

                    fs.write(fd, buffer, 0, buffer.length, null, function(err) {
                        if (err) throw 'error writing file: ' + err;
                        fs.close(fd, function() {
                            //console.log('file written');

                            vscode.workspace.openTextDocument(filePath)
                            .then(function(document) {
                                vscode.window.showTextDocument(document);
                                vscode.window.showInformationMessage('Successfully imported ' + importDirectory + fileName);
                                log.appendLine('Successfully imported file to ' + filePath);
                            });

                        })
                    });
                });
            }
        })
        .catch(function(error) {
            util.printOpenWhiskError(error);
        });
    });
}

function isSequence(result) {
    if (result.parameters) {
        for (var x=0; x < result.parameters.length; x ++){
            var param =  result.parameters[x];
            if (param.key == '_actions') {
                return true;
            }
        }
    }
    return false;
}

function initAction(params) {

    if (!hasValidProjectRoot()) {
        return;
    }

    vscode.window.showQuickPick( [NODE, PHP, PYTHON, SWIFT], {placeHolder:'Select the type of action:'}).then( function (action) {

        if (action == undefined) {
            return;
        }

        log.show(true);
        log.appendLine('\n$ wsk action init:' + action);

        var templateName = action.toLowerCase()
        templateName = templateName.replace(/\s/g, '');
        templateName = context.extensionPath + "/static-src/templates/" + templateName + ".template"
        var template = '';


        var path = vscode.workspace.rootPath + importDirectory

        fs.readFile( templateName, 'utf8', function (err,data) {
            if (err) {
                log.appendLine(err);
                console.log(err)
                return false;
            }

            template = data.toString()

            //todo: make it look for unique names or prompt for name

            var buffer = new Buffer(template);
            var fileName = 'newAction';
            var fileExt = '';
            if (action == NODE || action == NODE6) {
                fileExt += '.js'
            } else if (action == PHP) {
                fileExt += '.php'
            } else if (action == PYTHON) {
                fileExt += '.py'
            } else {
                fileExt += '.swift'
            }

            var path = vscode.workspace.rootPath + importDirectory

            if (!fs.existsSync(path)){
                fs.mkdirSync(path);
            }

            var filePath = getUniqueFilename(path, fileName, fileExt);

            fs.open(filePath, 'w', function(err, fd) {
                if (err) {
                    throw 'error opening file: ' + err;
                }

                fs.write(fd, buffer, 0, buffer.length, null, function(err) {
                    if (err) throw 'error writing file: ' + err;
                    fs.close(fd, function() {
                        //console.log('file written');

                        vscode.workspace.openTextDocument(filePath)
                        .then(function(document) {
                            //console.log(document)
                            vscode.window.showTextDocument(document);
                            log.appendLine('Created new action using ' + action + ' template as ' + filePath);
                        });

                    })
                });
            });

        });
    });
}

function restAction(params) {

    if (!props.validate()){
        return;
    }

    vscode.window.showQuickPick( getListAsStringArray(), {placeHolder:'Select an action to retrieve:'}).then( function (action) {

        if (action == undefined) {
            return;
        }

        var actionString = action.toString();
        var startIndex = actionString.indexOf('/');
        var namespace = actionString.substring(0, startIndex);
        var actionToGet = actionString.substring(startIndex+1);

        log.show(true);
        log.appendLine('\n$ wsk action get ' + actionToGet);

        var activityInterval = setInterval(function() {
            log.append('.');
        },300);


        var apiRoot = ow.actions.options.api
        var startTime = new Date().getTime();
        ow.actions.get({
            actionName: actionToGet,
            blocking:true,
            namespace: namespace
        }).then(function(result) {
            var totalTime = startTime - (new Date().getTime());;
            clearInterval(activityInterval);

            var hash = new Buffer(props.get('auth')).toString('base64')
            var parsedNamespace = util.parseQualifiedName(result.namespace)

            var restEndpoint =`curl -d '{ "arg": "value" }' '${props.host()}namespaces/${parsedNamespace.namespace}/actions/${parsedNamespace.name}/${result.name}?blocking=true' -X POST -H 'Authorization: Basic ${hash}' -H 'Content-Type: application/json'`;

            log.appendLine(`\nCURL REST invocation (You still need to set parameter key/value pairs):`);
            log.appendLine(`-------------------------------------------------------------------------`);
            log.appendLine(`\n${restEndpoint}`);
        })
        .catch(function(error) {
            util.printOpenWhiskError(error);
        });
    });
}

function hasValidProjectRoot() {
    if (vscode.workspace.rootPath == undefined) {
        var message = 'You must specify a project folder before you can import actions from OpenWhisk.  Please use the \'File\' menu, select \'Open\', then select a folder for your project.';

        log.show();
        log.appendLine(message);

        vscode.window.showWarningMessage(message)
        return false;
    }
    return true;
}

function getUniqueFilename(path, fileName, fileExt) {

    var unique = false;
    var attempt = 0;
    while (!unique) {
        var suffix = (attempt > 0) ? (attempt+1):"";
        var uniquePath = path + fileName + suffix + fileExt;

        //if file exists, updated attempt count and try again in the loop
        if (fs.existsSync(uniquePath)) {
            attempt++;
        }
        else {
            var unique = true;
            return uniquePath;
        }
    }
    return undefined;
}

module.exports = {
    register: register,
    list:list,
    getListAsStringArray:getListAsStringArray
};
