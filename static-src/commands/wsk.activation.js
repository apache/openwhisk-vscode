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

var log;
var ow;
var props;

function register(_ow, context, _log, _props) {
    ow = _ow;
    log = _log;
    props = _props;

    var defaultDisposable = vscode.commands.registerCommand('extension.wsk.activation', defaultAction);
    var listDisposable = vscode.commands.registerCommand('extension.wsk.activation.list', listAction);
    var getDisposable = vscode.commands.registerCommand('extension.wsk.activation.get', getAction);
    var logsDisposable = vscode.commands.registerCommand('extension.wsk.activation.logs', logsAction);
    var resultDisposable = vscode.commands.registerCommand('extension.wsk.activation.result', resultAction);


    context.subscriptions.push(defaultDisposable, listDisposable, getDisposable, logsDisposable,resultDisposable );
}


function defaultAction(params) {

    log.show(true);
    log.appendLine('\n$ wsk activation');
    log.appendLine('available commands:');
    log.appendLine('    list                retrieve activations');
    log.appendLine('    get                 get activation');
    log.appendLine('    logs                get the logs of an activation');
    log.appendLine('    result              get resul tof an activation');
}





function listAction(params) {

    if (!props.validate()){
        return;
    }

    log.show(true);
    log.appendLine('\n$ wsk activation list');
    list();
}

function list() {

    if (!props.validate()){
        return;
    }

    return getList().then(function (activations) {
        util.appendHeading('activations');
        for (var x=0; x<activations.length; x ++){
            util.appendActivation(activations[x]);
        }
    }).catch(function(error) {
        log.appendLine(error.toString())
    });
}


function getList() {
    return new Promise(function (fulfill, reject){
        return ow.activations.list({
            "docs":false,
            "skip":0,
            "limit":30,
            "namespace":"_"
        }).then(function (activations) {
            fulfill(activations);
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


function getAction(params) {

    if (!props.validate()){
        return;
    }

    var startTime = new Date().getTime();
    var callback = function(result) {
        var totalTime = startTime - (new Date().getTime());
        log.appendLine("\n"+JSON.stringify(result,  null, 4))
        log.appendLine('>> completed in ' + (-totalTime) + 'ms');
    };

    getActionImpl(params, "get", callback);
}


function logsAction(params) {

    if (!props.validate()){
        return;
    }

    var startTime = new Date().getTime();
    var callback = function(result) {
        var totalTime = startTime - (new Date().getTime());
        var logs = result.logs;
        log.appendLine("");
        if (result.logs) {
            for (var x =0; x <logs.length; x++) {
                log.appendLine(logs[x]);
            }
        }
        log.appendLine('>> completed in ' + (-totalTime) + 'ms');
    };

    getActionImpl(params, "logs", callback);
}


function resultAction(params) {

    if (!props.validate()){
        return;
    }

    var startTime = new Date().getTime();
    var callback = function(result) {
        var totalTime = startTime - (new Date().getTime());
        log.appendLine("\n"+JSON.stringify(result.response.result,  null, 4))
        log.appendLine('>> completed in ' + (-totalTime) + 'ms');
    };

    getActionImpl(params, "result", callback);
}


function getActionImpl(params, command, callback) {

    if (!props.validate()){
        return;
    }

    vscode.window.showInputBox({placeHolder:'Enter an activation id:'})
    .then(function(activationId){

        if (activationId == undefined) {
            return;
        }

        log.appendLine('\n$ wsk activation ' + command + ' ' + activationId);

        var activityInterval = setInterval(function() {
            log.append('.');
        },300);

        var invocationParams = {
            "activation": activationId,
            "namespace": "_"
        }
        ow.activations.get(invocationParams)
        .then(function(result) {
            clearInterval(activityInterval);
            callback(result)
        })
        .catch(function(error) {
            clearInterval(activityInterval);
            util.printOpenWhiskError(error);
        });
    });
}



module.exports = {
    register: register,
    list:list
};
