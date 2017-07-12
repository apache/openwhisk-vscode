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
let fs = require('fs');
var path = require('path');
let util = require('./util.js');

let log;
var ow;
var props;

var writeDelayTimeout = false;
let WRITE_DELAY_MS = 500;

let HOST = 'apiHost';
let NAMESPACE = 'namespace';
let AUTH = 'auth';

var config = {
    auth: '',
    namespace:'',
    apiHost:'openwhisk.ng.bluemix.net',
    apiVersion:'v1'
}

function userHome() {
    if (/^win/.test(process.platform)) {
        var homeDrive = process.env['HOMEDRIVE'];
        var homePath = process.env['HOMEPATH'];
        var home = path.join(homeDrive, homePath);
        if (homeDrive === undefined || homePath === undefined) {
            return process.env['USERPROFILE'];
        }
        else {
            return home;
        }
    }
    else {
        return process.env['HOME'];
    }
}

function configFile() {
    return path.join(userHome(), '.openwhisk/vscode-config.json');
}

function configDir() {
    return path.join(userHome(), '.openwhisk/');
}

function register(_ow, context, _log) {
    ow = _ow;
    log = _log;

    readConfigurationFile();
    updateOW();

    var setDisposable = vscode.commands.registerCommand('extension.wsk.property.set', setAction);
    var getDisposable = vscode.commands.registerCommand('extension.wsk.property.get', getAction);
    var unsetDisposable = vscode.commands.registerCommand('extension.wsk.property.unset', unsetAction);
    context.subscriptions.push(setAction, getAction, unsetAction);
}

function validate() {
    log.show(true);
    if (config.auth =='') {
        log.show(true);
        log.appendLine('Please check OpenWhisk config. Use \'wsk property set\' to specify missing values. ')
        getAction();
        return false;
    }
    return true;
}

function get(key) {
    if (config.hasOwnProperty(key)) {
        return config[key];
    }
    else return '';
}

function set(key, value, silent) {
    config[key] = value;

    switch(key) {
        case HOST:
            ow.apiHost
    }
    updateOW();
    setNeedsWrite(silent);
    if (silent != true) {
        log.appendLine(`set config: ${key}=${value}`);
    }

}

function host() {
    return `https://${config.apiHost}/api/${config.apiVersion}/`;
}

function setNeedsWrite(silent) {
    clearTimeout(writeDelayTimeout);
    setTimeout(function() {
        clearTimeout(writeDelayTimeout);
        writeConfigurationFile(silent);
    }, WRITE_DELAY_MS)
}

function readConfigurationFile() {
    if (fs.existsSync(configFile())) {
        try {
            var obj = JSON.parse(fs.readFileSync(configFile(), 'utf8'));
            for (var key in obj) {
                config[key] = obj[key];
            }
        }
        catch( error ) {
            log.appendLine('Error reading configuration file: ' + error.toString());
        }
    }
}

function writeConfigurationFile(silent) {
    var str = JSON.stringify(config);
    var buffer = new Buffer(str);

    if (!fs.existsSync(configDir())){
        fs.mkdirSync(configDir());
    }

    fs.open(configFile(), 'w', function(err, fd) {
        if (err) {
            throw 'error opening file: ' + err;
        }

        fs.write(fd, buffer, 0, buffer.length, null, function(err) {
            if (err) throw 'error writing file: ' + err;
            fs.close(fd, function() {
                if (silent != true) {
                    log.appendLine('Configuration saved in ' + configFile());
                }
            })
        });

    });


}


function getAvailableProperties() {
    return [HOST, NAMESPACE, AUTH]
}

function setAction(params) {
    vscode.window.showQuickPick(getAvailableProperties(), {prompt:'Select a property to update:'})
    .then(function(property){

        if (!property) {
            return;
        }

        vscode.window.showInputBox({prompt:`Enter value for ${property}:`})
        .then(function(value){

            if (!value) {
                return;
            }
            log.show(true);
            log.appendLine(`$ wsk property set ${property} ${value}`);
            set(property, value);
        });

    });
}

function getAction(params) {

    log.show(true);
    log.appendLine('$ wsk property get');
    var props = getAvailableProperties()
    for (var x=0; x<props.length; x++) {
        var key = props[x];
        var output = util.pad(key, 20) + get(key);
        log.appendLine(output);
    }
}

function unsetAction(params) {
    vscode.window.showQuickPick(getAvailableProperties(), {prompt:'Select a property to update:'})
    .then(function(property){

        if (!property) {
            return;
        }
        log.show(true);
        log.appendLine(`$ wsk property unset ${property}`);
        set(property, undefined);
    });
}

function updateOW() {
    var options = {api: host(), api_key: get(AUTH), namespace: get(NAMESPACE)};
    ow.actions.options = options;
    ow.packages.options = options;
    ow.rules.options = options;
    ow.triggers.options = options;
    ow.namespaces.options = options;
    ow.activations.options = options;
}


module.exports = {
    register:register,
    get: get,
    set: set,
    host: host,
    validate:validate
}
