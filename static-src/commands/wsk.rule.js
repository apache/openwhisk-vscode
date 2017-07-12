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


let wskAction = require('./wsk.action.js');
let wskTrigger = require('./wsk.trigger.js');

var log;
var ow;
var props;

function register(_ow, context, _log, _props) {
    ow = _ow;
    log = _log;
    props = _props;

    var defaultDisposable = vscode.commands.registerCommand('extension.wsk.rule', defaultAction);
    var listDisposable = vscode.commands.registerCommand('extension.wsk.rule.list', listAction);
    var createDisposable = vscode.commands.registerCommand('extension.wsk.rule.create', createAction);
    var updateDisposable = vscode.commands.registerCommand('extension.wsk.rule.update', updateAction);
    var deleteDisposable = vscode.commands.registerCommand('extension.wsk.rule.delete', deleteAction);
    var getDisposable = vscode.commands.registerCommand('extension.wsk.rule.get', getAction);
    var statusDisposable = vscode.commands.registerCommand('extension.wsk.rule.status', statusAction);
    var enableDisposable = vscode.commands.registerCommand('extension.wsk.rule.enable', enableAction);
    var disableDisposable = vscode.commands.registerCommand('extension.wsk.rule.disable', disableAction);

    context.subscriptions.push(defaultDisposable, listDisposable, createDisposable, updateDisposable, deleteDisposable, getDisposable, statusDisposable, enableDisposable, disableDisposable, enableAction, disableAction);
}


function defaultAction(params) {

    log.show(true);
    log.appendLine('\n$ wsk rule');
    log.appendLine('available commands:');
    log.appendLine('    create              create new rule');
    log.appendLine('    delete              delete rule');
    log.appendLine('    update              update an existing rule');
    log.appendLine('    enable              enable rule');
    log.appendLine('    disable             disable rule');
    log.appendLine('    status              get rule status');
    log.appendLine('    get                 get rule');
    log.appendLine('    list                list all rules');
}





function listAction(params) {

    if (!props.validate()){
        return;
    }

    log.show(true);
    log.appendLine('\n$ wsk rule list');
    list();
}

function list() {

    if (!props.validate()){
        return;
    }

    return getList().then(function (rules) {
        util.appendHeading('rules');
        for (var x=0; x<rules.length; x ++){
                util.appendEntry(rules[x]);
        }
    }).catch(function(error) {
        log.appendLine(error.toString())
    });
}


function getList() {
    return new Promise(function (fulfill, reject){
        return ow.rules.list().then(function (rules) {
            fulfill(rules);
        }).catch(function(error) {
            log.appendLine(error.toString())
        });
    });
}

function getListAsStringArray() {
    return getList().then(function (rules) {
        var result = [];
        for (var x=0; x<rules.length; x ++){
            var name = util.formatQualifiedName(rules[x]);
            result.push(name)
        }
        return result;
    })
}



function getActionListAsStringArray() {
    return wskAction.getListAsStringArray()
}
function getTriggerListAsStringArray() {
    return wskTrigger.getListAsStringArray()
}



function createAction(params) {

    if (!props.validate()){
        return;
    }

    var YES = 'Yes';
    var NO = 'No';

    vscode.window.showInputBox({placeHolder:'Enter a name for your rule:'})
    .then(function(rule){

        if (rule == undefined) {
            return;
        }

        vscode.window.showQuickPick(getTriggerListAsStringArray(), {placeHolder:'Select a trigger to bind:'})
        .then(function(trigger){

            if (trigger == undefined) {
                return;
            }


            vscode.window.showQuickPick(getActionListAsStringArray(), {placeHolder:'Select a action to bind:'})
            .then(function(action){

                if (action == undefined) {
                    return;
                }

                var parsedTrigger = util.parseQualifiedName(trigger);
                var parsedAction = util.parseQualifiedName(action);

                log.show(true);
                log.appendLine(`\n$ wsk rule create ${rule} ${parsedTrigger.name} ${parsedAction.name}`);

                var activityInterval = setInterval(function() {
                    log.append('.');
                },300);

                var startTime = new Date().getTime();
                var invocationParams = {
                    ruleName: rule,
                    trigger:parsedTrigger.name,
                    action:parsedAction.name
                }

                ow.rules.create(invocationParams)
                .then(function(result) {
                    var totalTime = startTime - (new Date().getTime());
                    clearInterval(activityInterval);
                    log.appendLine(JSON.stringify(result,  null, 4))
                    log.appendLine('>> completed in ' + (-totalTime) + 'ms');


                    vscode.window.showWarningMessage('Would you like to activate  ' + rule + '?', YES, NO)
                    .then( function(selection) {
                        if (selection === YES) {

                            var qualifiedRule = props.get("namespace") + "/" + rule;

                            doStatusChange(qualifiedRule, true);
                        }
                    });

                })
                .catch(function(error) {
                    clearInterval(activityInterval);
                    util.printOpenWhiskError(error);
                });

            })
        })
    });
}

function updateAction(params) {

    if (!props.validate()){
        return;
    }

    var YES = 'Yes';
    var NO = 'No';

    vscode.window.showQuickPick(getListAsStringArray(), {placeHolder:'Select a rule to update:'})
    .then(function(rule){

        if (rule == undefined) {
            return;
        }

        var parsedRule = util.parseQualifiedName(rule);
        rule = parsedRule.name;


        vscode.window.showQuickPick(getTriggerListAsStringArray(), {placeHolder:'Select a trigger to bind:'})
        .then(function(trigger){

            if (trigger == undefined) {
                return;
            }

            vscode.window.showQuickPick(getActionListAsStringArray(), {placeHolder:'Select a action to bind:'})
            .then(function(action){

                if (action == undefined) {
                    return;
                }

                var parsedTrigger = util.parseQualifiedName(trigger);
                var parsedAction = util.parseQualifiedName(action);

                log.show(true);
                log.appendLine(`\n$ wsk rule update ${rule} ${parsedTrigger.name} ${parsedAction.name}`);

                vscode.window.showWarningMessage('Are you sure you want to overwrite ' + rule, YES, NO)
                .then( function(selection) {
                    if (selection === YES) {

                        var activityInterval = setInterval(function() {
                            log.append('.');
                        },300);

                        var startTime = new Date().getTime();
                        var invocationParams = {
                            ruleName: rule,
                            trigger:parsedTrigger.name,
                            action:parsedAction.name
                        }

                        ow.rules.update(invocationParams)
                        .then(function(result) {
                            var totalTime = startTime - (new Date().getTime());
                            clearInterval(activityInterval);
                            log.appendLine(JSON.stringify(result,  null, 4))
                            log.appendLine('>> completed in ' + (-totalTime) + 'ms');
                        })
                        .catch(function(error) {
                            clearInterval(activityInterval);
                            util.printOpenWhiskError(error);
                        });
                    } else {
                        log.appendLine('cancelled by user')
                    }
                })
            })
        })
    });
}





function deleteAction(params) {

    if (!props.validate()){
        return;
    }

    vscode.window.showQuickPick(getListAsStringArray(), {placeHolder:'Select a rule to delete:'})
    .then(function(rule){

        if (rule == undefined) {
            return;
        }

        var parsedRule = util.parseQualifiedName(rule)

        log.show(true);
        log.appendLine('\n$ wsk trigger delete ' + parsedRule.name);

        var options = {
            ruleName: parsedRule.name,
            namespace: parsedRule.namespace
        };

        var YES = 'Yes';
        var NO = 'No';

        vscode.window.showWarningMessage('Are you sure you want to delete ' + parsedRule.name, YES, NO)
        .then( function(selection) {
            if (selection === YES) {
                ow.rules.delete(options)
                .then(function(result) {
                    var message = 'OpenWhisk rule deleted: ' + util.formatQualifiedName(result);
                    log.appendLine(message);
                    vscode.window.showInformationMessage(message);
                })
                .catch(function(error) {
                    log.appendLine('rule status must be \'inactive\' to delete');
                });
            }
        });
    });
}


function getAction(params) {

    if (!props.validate()){
        return;
    }

    vscode.window.showQuickPick(getListAsStringArray(), {placeHolder:'Select a rule to fetch:'})
    .then(function(rule){

        if (rule == undefined) {
            return;
        }

        var parsedRule = util.parseQualifiedName(rule)

        log.appendLine('\n$ wsk rule get ' + parsedRule.name);

        var activityInterval = setInterval(function() {
            log.append('.');
        },300);

        var startTime = new Date().getTime();
        var invocationParams = {
            ruleName: parsedRule.name,
            blocking:true,
            namespace: parsedRule.namespace
        }
        ow.rules.get(invocationParams)
        .then(function(result) {
            var totalTime = startTime - (new Date().getTime());
            clearInterval(activityInterval);
            log.appendLine(JSON.stringify(result,  null, 4))
            log.appendLine('>> completed in ' + (-totalTime) + 'ms');
        })
        .catch(function(error) {
            clearInterval(activityInterval);
            util.printOpenWhiskError(error);
        });
    });
}


function statusAction(params) {

    if (!props.validate()){
        return;
    }

    vscode.window.showQuickPick(getListAsStringArray(), {placeHolder:'Select a rule to fetch:'})
    .then(function(rule){

        if (rule == undefined) {
            return;
        }

        var parsedRule = util.parseQualifiedName(rule)

        log.appendLine('\n$ wsk rule status ' + parsedRule.name);

        var activityInterval = setInterval(function() {
            log.append('.');
        },300);

        var startTime = new Date().getTime();
        var invocationParams = {
            ruleName: parsedRule.name,
            blocking:true,
            namespace: parsedRule.namespace
        }
        ow.rules.get(invocationParams)
        .then(function(result) {
            var totalTime = startTime - (new Date().getTime());
            clearInterval(activityInterval);
            log.appendLine(`\nok: rule ${parsedRule.name} is ${result.status}`)
            log.appendLine('>> completed in ' + (-totalTime) + 'ms');
        })
        .catch(function(error) {
            clearInterval(activityInterval);
            util.printOpenWhiskError(error);
        });
    });
}




function enableAction(params) {

    doStatusChange(undefined, true);
}

function disableAction(params) {

    doStatusChange(undefined, false);
}

function doStatusChange(rule, enable) {
    if (!props.validate()){
        return;
    }

    var statusChangeImpl = function(rule){

        if (rule == undefined) {
            return;
        }

        var parsedRule = util.parseQualifiedName(rule)
        log.appendLine(`\n$ wsk rule ${enable?'enable':'disable'} ${parsedRule.name}`);

        var activityInterval = setInterval(function() {
            log.append('.');
        },300);

        var startTime = new Date().getTime();
        var invocationParams = {
            ruleName: parsedRule.name,
            blocking:true,
            namespace: parsedRule.namespace
        }

        var callback = function(result) {
            var totalTime = startTime - (new Date().getTime());
            clearInterval(activityInterval);
            log.appendLine(`ok: rule ${parsedRule.name} ${enable?'enabled':'disabled'}`)
            log.appendLine('>> completed in ' + (-totalTime) + 'ms');
        }
        var error = function(error) {
            clearInterval(activityInterval);
            util.printOpenWhiskError(error);
        }

        if (enable) {
            ow.rules.enable(invocationParams)
            .then(callback)
            .catch(error);
        } else {
            ow.rules.disable(invocationParams)
            .then(callback)
            .catch(error);
        }
    }

    if (rule == undefined) {
        //${enable?'enable'?'disable'}
        vscode.window.showQuickPick(getListAsStringArray(), {placeHolder:`Select a rule to :`})
        .then(statusChangeImpl);
    } else {
        statusChangeImpl(rule)
    }

}



module.exports = {
    register: register,
    list:list
};
