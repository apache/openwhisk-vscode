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

"use strict";

var vscode = require('vscode');
var openwhisk = require('openwhisk');

let util = require("./util.js");
let wskLst = require("./wsk.list.js");
let wskHelp = require("./wsk.help.js");
let wskAction = require("./wsk.action.js");
let wskPackage = require("./wsk.package.js");
let wskTrigger = require("./wsk.trigger.js");
let wskRule = require("./wsk.rule.js");
let wskUtil = require("./wsk.util.js");
let wskActivation = require("./wsk.activation.js");
let wskProperty = require("./wsk.property.js");

var ow;
let log = vscode.window.createOutputChannel("OpenWhisk");


function init(context) {

    //api key and namespace will be set when config values are loaded
    ow = openwhisk({api: 'https://openwhisk.ng.bluemix.net/api/v1/', api_key: 'invalid', namespace: ''});

    util.setLog(log);

    wskProperty.register(ow, context, log);
    wskLst.register(ow, context, log, wskProperty);
    wskHelp.register(ow, context, log, wskProperty);
    wskAction.register(ow, context, log, wskProperty);
    wskPackage.register(ow, context, log, wskProperty);
    wskTrigger.register(ow, context, log, wskProperty);
    wskRule.register(ow, context, log, wskProperty);
    wskUtil.register(ow, context, log, wskProperty);
    wskActivation.register(ow, context, log, wskProperty);
}

module.exports = {
    init: init,
    ow: ow
};
