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

    var defaultDisposable = vscode.commands.registerCommand('extension.wsk.package', defaultAction);
    context.subscriptions.push(defaultDisposable);
}


function defaultAction(params) {
    log.show(true);
    log.appendLine('\n$ wsk package');
    log.appendLine('available commands:');
    log.appendLine('    create              create a new package');
    log.appendLine('    update              create a new package');
    log.appendLine('    bind                bind parameters to the package');
    log.appendLine('    refresh             refresh package bindings');
    log.appendLine('    get                 get package');
    log.appendLine('    delete              delete package');
    log.appendLine('    list                list all packages');
}

function list() {

    if (!props.validate()){
        return;
    }

    return ow.packages.list().then(function (packages) {
        util.appendHeading('packages');
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
