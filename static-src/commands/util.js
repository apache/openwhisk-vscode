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
let log;

function pad(input, length) {
    if (input == undefined) {
        input = '';
    }
    while (input.length < length) {
        input += ' ';
    }
    return input;
}

function appendHeading(name) {
    log.appendLine('\n'+name+'\n---------------------------------------------------------------------------------');
}

function appendEntry(entry, qualified) {

    var qualifiedName = formatQualifiedName(entry, qualified);
    var suffix = ''

    if ( entry.hasOwnProperty('binding') && entry.binding ) {
        suffix = ' binding';
    }

    log.appendLine( pad(qualifiedName, 66) + (entry.publish ? 'public':'private') + suffix);
}

function appendActivation(entry, qualified) {

    var qualifiedName = formatQualifiedName(entry, qualified);
    var suffix = ''

    if ( entry.hasOwnProperty('binding') && entry.binding ) {
        suffix = ' binding';
    }

    log.appendLine( pad(entry.activationId, 45) + entry.name);
}

function formatQualifiedName(entry, qualified) {
    if (qualified == undefined) {
        qualified = true;
    }

    var qualifiedName = (qualified ? (entry.namespace + '/'):'') + entry.name;
    return qualifiedName;
}

function parseQualifiedName(name) {
    var nameString = name.toString();
    var startIndex = nameString.indexOf('/');
    var namespace = nameString.substring(0, startIndex);
    var parsedName = nameString.substring(startIndex+1);
    return {
        "name":parsedName,
        "namespace":namespace
    };
}

function setLog(_log) {
    log = _log;
}

function printOpenWhiskError(error) {
    log.appendLine('\nERROR: '+error.toString());
    if (error.error.activationId) {
        log.appendLine('activationId: '+error.error.activationId);
    }
    if (error.error.logs && (error.error.logs.length > 0)) {
        for (var x=0; x<error.error.logs.length; x++) {
            log.appendLine(error.error.logs[x]);
        }
    }
    else if (error.error.error) {
        log.appendLine(error.error.error);
    }
}

function parseParametersString(parameterString) {
    var params = {};

    var tokens = parameterString.split('-p ');

    for (var x=0; x<tokens.length; x++) {
        var token = tokens[x]
        var firstSpace = token.indexOf(' ');
        if (token.length >0 && firstSpace >= 0) {
            var key = token.substring(0, firstSpace).trim();
            var value = token.substring(firstSpace+1).trim();
            params[key] = value;
        }
    }

    console.log(params)

    return params;
}

module.exports = {
    pad:pad,
    appendHeading:appendHeading,
    appendEntry:appendEntry,
    formatQualifiedName:formatQualifiedName,
    setLog:setLog,
    printOpenWhiskError: printOpenWhiskError,
    parseParametersString: parseParametersString,
    parseQualifiedName:parseQualifiedName,
    appendActivation:appendActivation
}
