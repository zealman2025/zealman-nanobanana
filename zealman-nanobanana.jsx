// zealman BizyAir NanoBanana 图像处理插件 for Photoshop

#target photoshop;

// 主程序入口
try {
if (app.documents.length == 0) {
        alert("请先在Photoshop中打开一个文档。");
} else {
    main();
    }
} catch (e) {
    alert("插件初始化失败：\n" + e.toString() + 
          (e.line ? "\n行号: " + e.line : "") +
          "\n\n请检查Photoshop版本是否支持此插件。");
}

function main() {
    // 配置
    var scriptDataFolder = Folder.userData + "/ZealmanNanoBanana";
    var scriptFolder = new Folder(scriptDataFolder);
    if (!scriptFolder.exists) {
        scriptFolder.create();
    }
    
    var settingsFile = new File(scriptDataFolder + "/settings.txt");
    var translateSettingsFile = new File(scriptDataFolder + "/translate_settings.txt");
    var descSettingsFile = new File(scriptDataFolder + "/desc_settings.txt");
    var apiKey = loadAPIKey();
    var translateSettings = loadTranslateSettings();
    var descSettings = loadDescSettings();
    
    // API配置 - BizyAir NanoBanana API
    var webAppId = 36239;
    var apiEndpoint = "https://api.bizyair.com/w/v1/webapp/task/openapi/create";
    
    // 加载API密钥
    function loadAPIKey() {
        if (settingsFile.exists) {
            settingsFile.open('r');
            var key = settingsFile.read();
            settingsFile.close();
            return key;
        }
        return "";
    }
    
    // 保存API密钥
    function saveAPIKey(key) {
        settingsFile.open('w');
        settingsFile.write(key);
        settingsFile.close();
    }
    
    // 加载翻译设置
    function loadTranslateSettings() {
        if (translateSettingsFile.exists) {
            translateSettingsFile.open('r');
            var content = translateSettingsFile.read();
            translateSettingsFile.close();
            try {
                var settings = eval('(' + content + ')');
                // 确保包含翻译开关状态
                if (typeof settings.enableTranslate === 'undefined') {
                    settings.enableTranslate = false;
                }
                return settings;
            } catch (e) {
                return { appId: "", apiKey: "", enableTranslate: false };
            }
        }
        return { appId: "", apiKey: "", enableTranslate: false };
    }
    
    // 保存翻译设置
    function saveTranslateSettings(settings) {
        translateSettingsFile.open('w');
        translateSettingsFile.write(JSON.stringify(settings));
        translateSettingsFile.close();
    }
    
    // 加载描述设置
    function loadDescSettings() {
        if (descSettingsFile.exists) {
            descSettingsFile.open('r');
            var content = descSettingsFile.read();
            descSettingsFile.close();
            try {
                var settings = eval('(' + content + ')');
                // 确保包含所有必要字段
                if (typeof settings.enableFixedDesc === 'undefined') {
                    settings.enableFixedDesc = false;
                }
                if (typeof settings.fixedDesc === 'undefined') {
                    settings.fixedDesc = "";
                }
                return settings;
            } catch (e) {
                return { fixedDesc: "", enableFixedDesc: false };
            }
        }
        return { fixedDesc: "", enableFixedDesc: false };
    }
    
    // 保存描述设置
    function saveDescSettings(settings) {
        descSettingsFile.open('w');
        descSettingsFile.write(JSON.stringify(settings));
        descSettingsFile.close();
    }
    
    // JSON2 库用于 ExtendScript 兼容性
    if (typeof JSON !== "object") {
        JSON = {};
    }
    (function () {
        "use strict";
        var rx_one = /^[\],:{}\s]*$/;
        var rx_two = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
        var rx_three = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
        var rx_four = /(?:^|:|,)(?:\s*\[)+/g;
        var rx_escapable = /[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
        
        var meta = {
            "\b": "\\b",
            "\t": "\\t",
            "\n": "\\n",
            "\f": "\\f",
            "\r": "\\r",
            "\"": "\\\"",
            "\\": "\\\\"
        };
        
        function quote(string) {
            rx_escapable.lastIndex = 0;
            return rx_escapable.test(string) ?
                "\"" + string.replace(rx_escapable, function (a) {
                    var c = meta[a];
                    return typeof c === "string" ?
                        c :
                        "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
                }) + "\"" :
                "\"" + string + "\"";
        }
        
        if (typeof JSON.stringify !== "function") {
            JSON.stringify = function (value, replacer, space) {
                var i;
                var gap = "";
                var indent = "";
                if (typeof space === "number") {
                    for (i = 0; i < space; i += 1) {
                        indent += " ";
                    }
                } else if (typeof space === "string") {
                    indent = space;
                }
                
                function str(key, holder) {
                    var i, k, v, length, mind = gap, partial, value = holder[key];
                    if (value && typeof value === "object" && typeof value.toJSON === "function") {
                        value = value.toJSON(key);
                    }
                    if (typeof replacer === "function") {
                        value = replacer.call(holder, key, value);
                    }
                    switch (typeof value) {
                        case "string":
                            return quote(value);
                        case "number":
                            return (isFinite(value)) ? String(value) : "null";
                        case "boolean":
                        case "null":
                            return String(value);
                        case "object":
                            if (!value) {
                                return "null";
                            }
                            gap += indent;
                            partial = [];
                            if (Object.prototype.toString.apply(value) === "[object Array]") {
                                length = value.length;
                                for (i = 0; i < length; i += 1) {
                                    partial[i] = str(i, value) || "null";
                                }
                                v = partial.length === 0 ? "[]" :
                                    gap ? "[\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "]" :
                                    "[" + partial.join(",") + "]";
                                gap = mind;
                                return v;
                            }
                            for (k in value) {
                                if (Object.prototype.hasOwnProperty.call(value, k)) {
                                    v = str(k, value);
                                    if (v) {
                                        partial.push(quote(k) + (gap ? ": " : ":") + v);
                                    }
                                }
                            }
                            v = partial.length === 0 ? "{}" :
                                gap ? "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}" :
                                "{" + partial.join(",") + "}";
                            gap = mind;
                            return v;
                    }
                }
                return str("", {"": value});
            };
        }
        
        if (typeof JSON.parse !== "function") {
            JSON.parse = function (text, reviver) {
                var j;
                function walk(holder, key) {
                    var k, v, value = holder[key];
                    if (value && typeof value === "object") {
                        for (k in value) {
                            if (Object.prototype.hasOwnProperty.call(value, k)) {
                                v = walk(value, k);
                                if (v !== undefined) {
                                    value[k] = v;
                                } else {
                                    delete value[k];
                                }
                            }
                        }
                    }
                    return reviver.call(holder, key, value);
                }
                text = String(text);
                if (/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@")
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]")
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ""))) {
                    j = eval("(" + text + ")");
                    return (typeof reviver === "function") ? walk({"": j}, "") : j;
                }
                throw new SyntaxError("JSON.parse");
            };
        }
    }());
    
    // HTTP请求函数 (用于BizyAir API调用)
    function makeHttpRequest(url, method, headers, body) {
        try {
            // 创建临时文件存储请求数据和响应
            var timestamp = new Date().getTime();
            var requestFile = new File(Folder.temp + "/request_" + timestamp + ".json");
            var responseFile = new File(Folder.temp + "/response_" + timestamp + ".json");
            
            // 写入请求数据
            requestFile.open("w");
            requestFile.write(body);
            requestFile.close();
            
            // 构建curl命令
            var curlCmd = 'curl -s -X ' + method + ' "' + url + '"';
            
            // 添加请求头
            for (var header in headers) {
                if (headers.hasOwnProperty(header)) {
                    curlCmd += ' -H "' + header + ': ' + headers[header] + '"';
                }
            }
            
            // 添加请求体
            if (body) {
                curlCmd += ' -d @"' + requestFile.fsName + '"';
            }
            
            // 输出重定向
            curlCmd += ' > "' + responseFile.fsName + '" 2>&1';
            
            // 执行命令
            var isWindows = $.os.indexOf("Windows") !== -1;
            if (isWindows) {
                app.system('cmd.exe /c ' + curlCmd);
            } else {
                app.system('/bin/sh -c \'' + curlCmd + '\'');
            }
            
            // 读取响应
            var response = null;
            if (responseFile.exists) {
                responseFile.open("r");
                response = responseFile.read();
                responseFile.close();
                responseFile.remove();
            }
            
            // 清理临时文件
            if (requestFile.exists) requestFile.remove();
            
            return response;
        } catch (e) {
            alert("HTTP请求失败: " + e.toString());
            return null;
        }
    }

    function getBase64Command(inputFile, outputFile) {
        var isWindows = $.os.indexOf("Windows") !== -1;
        if (isWindows) {
            return 'cmd.exe /c certutil -encode "' + inputFile + '" "' + outputFile + '"';
        } else {
            return 'base64 -i "' + inputFile + '" > "' + outputFile + '"';
        }
    }
    
    function escapeJsonString(str) {
        return str.replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
    }

    // 将图片转换为base64编码的data URI
    function convertImageToBase64(imageFile, progressWin, statusText, detailText) {
        try {
            // 更新进度窗口状态
            if (progressWin && statusText && detailText) {
                statusText.text = "转换图片中...";
                detailText.text = "正在将图片转换为base64格式...";
                progressWin.update();
            }
            
            // 检查图片文件是否存在
            if (!imageFile.exists) {
                alert("图片文件不存在: " + imageFile.fsName);
                return null;
            }
            
            // 获取图片文件扩展名来确定MIME类型
            var fileName = imageFile.name.toLowerCase();
            var mimeType = "image/jpeg"; // 默认
            if (fileName.indexOf(".png") !== -1) {
                mimeType = "image/png";
            } else if (fileName.indexOf(".gif") !== -1) {
                mimeType = "image/gif";
            } else if (fileName.indexOf(".webp") !== -1) {
                mimeType = "image/webp";
            }
            
            // 使用现有的encodeImageToBase64函数获取base64数据
            var base64Data = encodeImageToBase64(imageFile);
            
            if (!base64Data) {
                alert("图片转换失败。请检查图片文件格式是否支持。");
                return null;
            }
            
            // 构建完整的data URI
            var dataUri = "data:" + mimeType + ";base64," + base64Data;
            
            return dataUri;
        } catch (e) {
            alert("图片转换过程出错: " + e.toString());
            return null;
        }
    }

    // 优化的Base64编码函数 (添加超时和进度反馈)
    function encodeImageToBase64(file) {
        try {
            var timestamp = new Date().getTime();
            // 临时base64文件名
            var base64File = new File(Folder.temp + "/base64_tmp_" + timestamp + ".txt");
            
            // 使用基本命令，移除可能有问题的超时设置
            var cmd = getBase64Command(file.fsName, base64File.fsName);
            
            app.system(cmd);
            
            if (!base64File.exists) {
                alert("无法将图片转换为base64格式。请检查图片文件是否完整。");
                return null;
            }
            
            base64File.open("r");
            var base64Data = base64File.read();
            base64File.close();
            base64File.remove();
            
            // 检查base64数据有效性
            if (!base64Data || base64Data.length < 100) {
                alert("生成的base64数据无效。请检查图片格式。");
                return null;
            }
            
            // 清理Windows certutil的输出格式
            if ($.os.indexOf("Windows") !== -1) {
                base64Data = base64Data.replace(/-----BEGIN CERTIFICATE-----/g, "");
                base64Data = base64Data.replace(/-----END CERTIFICATE-----/g, "");
            }
            base64Data = base64Data.replace(/[\r\n\s]/g, "");
            
            return base64Data;
        } catch (e) {
            alert("Base64编码失败: " + e.toString() + "\n建议：尝试使用更小的图片文件。");
            return null;
        }
    }
    
    // BizyAir API调用方法
    function callBizyAirAPI(promptText, imageFile, progressWin, statusText, detailText) {
        try {
            // 1) 将图片转换为base64编码的data URI
            var imageBase64 = convertImageToBase64(imageFile, progressWin, statusText, detailText);
            
            // 如果转换失败，显示错误并返回
            if (!imageBase64) {
                alert("图片转换失败，无法继续API调用\n\n请检查：\n• 图片文件是否存在\n• 图片格式是否支持");
                return null;
            }

            // 2) 构建BizyAir API请求载荷
            var requestBody = {
                "web_app_id": webAppId,
                "suppress_preview_output": false,
                "input_values": {
                    "18:LoadImage.image": imageBase64,
                    "22:BizyAir_NanoBanana.prompt": promptText
                }
            };
            
            var requestPayload = JSON.stringify(requestBody);

            // 3) 发送BizyAir API请求 - 使用指定的端点
            var apiEndpoint = "https://api.bizyair.cn/w/v1/webapp/task/openapi/create";
            
            var requestHeaders = {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + apiKey
            };
            
            var response = makeHttpRequest(apiEndpoint, "POST", requestHeaders, requestPayload);
            
            if (!response) {
                var errorMsg = "⚠️ BizyAir API调用失败\n\n";
                errorMsg += "使用端点: " + apiEndpoint + "\n\n";
                errorMsg += "检查项目：\n";
                errorMsg += "• API密钥是否正确\n";
                errorMsg += "• 网络连接是否正常\n";
                errorMsg += "• 图片是否成功上传\n";
                errorMsg += "• 请求格式是否正确\n\n";
                errorMsg += "请检查上述问题后重试";
                
                alert(errorMsg);
                return null;
            }
            
            // 解析BizyAir API响应
            try {
                var jsonResponse = eval('(' + response + ')');
                
                // 检查响应状态
                if (jsonResponse && jsonResponse.status === "Success") {
                    // API调用成功，返回完整响应供后续处理
                    return response;
                } else if (jsonResponse && jsonResponse.status) {
                    // API返回了状态但不是Success
                    var errorMsg = "⚠️ BizyAir API调用失败\n\n";
                    errorMsg += "状态: " + jsonResponse.status + "\n";
                    if (jsonResponse.message) {
                        errorMsg += "消息: " + jsonResponse.message + "\n";
                    }
                    errorMsg += "\n完整响应: " + response.substring(0, 200) + "...";
                    alert(errorMsg);
                    return null;
                } else {
                    // 响应格式不符合预期，但可能仍然有效
                    return response;
                }
            } catch (e) {
                // JSON解析失败，但响应可能仍然有效
                if (response && response.length > 10) {
                    return response;
                } else {
                    alert("API响应解析失败: " + e.toString());
                    return null;
                }
            }
            
            return response;

        } catch (e) {
            alert("API调用出错: " + e.toString());
            return null;
        }
    }
    
    // 创建主对话框（中文界面）
    var mainDialog = new Window("dialog", "zealman BizyAir NanoBanana v1.0 本插件免费无需魔法");
    mainDialog.orientation = "column";
    mainDialog.alignChildren = "fill";
    mainDialog.spacing = 10;
    mainDialog.margins = 16;
        
    // 标题栏包含交流群信息和设置按钮
    var headerGroup = mainDialog.add("group");
    headerGroup.alignment = "fill";
    
    // 交流群信息
    var titleGroup = headerGroup.add("group");
    titleGroup.add("statictext", undefined, "需要设置API才能使用哦");
    titleGroup.alignment = "left";

    // 设置按钮
    var buttonGroup = headerGroup.add("group");
    buttonGroup.alignment = "right";
    var settingsButton = buttonGroup.add("button", undefined, "API设置");
    var translateButton = buttonGroup.add("button", undefined, "翻译设置");
    var descButton = buttonGroup.add("button", undefined, "描述设置");
    
    // 提示词输入区域
    var promptGroup = mainDialog.add("group");
    promptGroup.orientation = "column";
    promptGroup.alignChildren = "fill";
    
    var promptLabel = promptGroup.add("statictext", undefined, "提示词(英文):");
    var promptText = promptGroup.add("edittext", undefined, "", {multiline: true});
    promptText.preferredSize.height = 100;
    promptText.text = "Change the background color of the image to white gradually to green";
    
    // 固定描述提示文本
    var fixedDescNotice = promptGroup.add("statictext", undefined, "您已在描述设置中启用固定描述，输入框将在关闭固定描述后显示");
    fixedDescNotice.preferredSize.height = 20;
    fixedDescNotice.graphics.font = ScriptUI.newFont(fixedDescNotice.graphics.font.name,  12);
    fixedDescNotice.visible = false; // 初始隐藏
    
    
    // 选项
    var optionsPanel = mainDialog.add("panel", undefined, "可选");
    optionsPanel.orientation = "column";
    optionsPanel.alignChildren = "left";
    
    var outputNewDoc = optionsPanel.add("checkbox", undefined, "生成到创建的新PSD");
    
    // 使用说明 - 结构化布局
    var infoPanel = mainDialog.add("panel", undefined, "说明");
    infoPanel.orientation = "column";
    infoPanel.alignChildren = "left";
    infoPanel.spacing = 5;
    
    // 工作模式说明
    var modeGroup = infoPanel.add("group");
    modeGroup.orientation = "column";
    modeGroup.alignChildren = "left";
    var modeTexts = [
        "有选区：AI仅处理选中区域，返回图像自动缩放到选区大小",
        "无选区：AI处理整个图像，返回图像为API输出原始大小",
        "生成不和谐的内容可能不会返回图像",
        "每次生成消耗150金币约0.15元RMB（以官方为准）",
    ];
    for (var i = 0; i < modeTexts.length; i++) {
        var staticText = modeGroup.add("statictext", undefined, modeTexts[i]);
        staticText.characters = 40;
        staticText.graphics.font = ScriptUI.newFont(staticText.graphics.font.name, staticText.graphics.font.style, staticText.graphics.font.size - 1);
        staticText.margins = [0, -10, 0, -10]; // 极小的上下边距，最大限度减小行距
    }
    
    // 按钮
    var buttonGroup = mainDialog.add("group");
    buttonGroup.alignment = "center";
    var generateButton = buttonGroup.add("button", undefined, "开始表演");
    var cancelButton = buttonGroup.add("button", undefined, "取消");
    
    // 事件处理器
    
    settingsButton.onClick = function() {
        showSettingsDialog();
    };
    
    translateButton.onClick = function() {
        showTranslateSettingsDialog();
    };
    
    descButton.onClick = function() {
        showDescSettingsDialog();
    };
    
    generateButton.onClick = function() {
        if (!apiKey) {
            alert("请先在设置中配置BizyAir API密钥。");
            return;
        }
        
        if (!promptText.text || promptText.text.indexOf("生成一张图片，在原图基础上") !== -1) {
            alert("请输入具体的图像生成指令。\n\n请描述你想要对图像进行的处理操作。");
            return;
        }
        
        // 检查翻译设置
        if (translateSettings.enableTranslate && (!translateSettings.appId || !translateSettings.apiKey)) {
            alert("请先在翻译设置中配置百度翻译的APP ID和API密钥。");
            return;
        }
        
        
        mainDialog.close(1);
        processGeneration();
    };
    
    cancelButton.onClick = function() {
        mainDialog.close(0);
    };
    
    // 设置对话框（中文界面）
    function showSettingsDialog() {
        var setDialog = new Window("dialog", "BizyAir API 密钥设置");
        setDialog.orientation = "column";
        setDialog.alignChildren = "fill";
        setDialog.spacing = 10;
        setDialog.margins = 16;
        
        // 标题
        var titleGroup = setDialog.add("group");
        titleGroup.add("statictext", undefined, "BizyAir API 密钥设置");
        titleGroup.add("statictext", undefined, "").preferredSize.height = 5; // 空行
        
        // 设置步骤
        var stepsPanel = setDialog.add("panel", undefined, "设置步骤");
        stepsPanel.orientation = "column";
        stepsPanel.alignChildren = "left";
        stepsPanel.spacing = 3;
        
        var step1 = stepsPanel.add("group");
        step1.add("statictext", undefined, "1.");
        step1.add("statictext", undefined, "访问 bizyair.com 并注册账户");
        
        var step2 = stepsPanel.add("group");
        step2.add("statictext", undefined, "2.");
        step2.add("statictext", undefined, "在个人中心创建并获取您的API密钥");
        
        var step3 = stepsPanel.add("group");
        step3.add("statictext", undefined, "3.");
        step3.add("statictext", undefined, "确保账户有足够额度的金币(150金币/1次)");
        
        var step4 = stepsPanel.add("group");
        step4.add("statictext", undefined, "4.");
        step4.add("statictext", undefined, "将API密钥粘贴到下方:");
        
        var keyGroup = setDialog.add("group");
        keyGroup.add("statictext", undefined, "API 密钥:");
        var keyInput = keyGroup.add("edittext", undefined, apiKey ? "****" + apiKey.substr(-5) : "");
        keyInput.preferredSize.width = 300;
        
        var costPanel = setDialog.add("panel", undefined, "交流群");
        costPanel.orientation = "column";
        costPanel.alignChildren = "left";
        costPanel.spacing = 3;
        
        costPanel.add("statictext", undefined, "• 插件交流群1059612745");
        costPanel.add("statictext", undefined, "• bizyair交流群736797167");
        
        var btnGroup = setDialog.add("group");
        btnGroup.alignment = "center";
        
        var updateBtn = btnGroup.add("button", undefined, "保存密钥");
        var cancelBtn = btnGroup.add("button", undefined, "取消");
        
        // 处理现有API密钥显示
        keyInput.onActivate = function() {
            if (keyInput.text.indexOf("****") === 0 && apiKey) {
                keyInput.text = apiKey;
            }
        };
        
        updateBtn.onClick = function() {
            var newKey = keyInput.text;
            if (!newKey || newKey.indexOf("****") === 0) {
                alert("请输入完整的API密钥。");
                return;
            }
            apiKey = newKey;
            saveAPIKey(apiKey);
            setDialog.close(1);
            alert("API密钥更新成功！");
        };
        
        cancelBtn.onClick = function() {
            setDialog.close(0);
        };
        
        setDialog.show();
    }
    
    // 翻译设置对话框
    function showTranslateSettingsDialog() {
        var translateDialog = new Window("dialog", "百度翻译API设置");
        translateDialog.orientation = "column";
        translateDialog.alignChildren = "fill";
        translateDialog.spacing = 10;
        translateDialog.margins = 16;
        
        // 标题
        var titleGroup = translateDialog.add("group");
        titleGroup.add("statictext", undefined, "百度翻译API设置");
        titleGroup.add("statictext", undefined, "").preferredSize.height = 5;
        
        // 设置步骤
        var stepsPanel = translateDialog.add("panel", undefined, "设置步骤");
        stepsPanel.orientation = "column";
        stepsPanel.alignChildren = "left";
        stepsPanel.spacing = 3;
        
        var step1 = stepsPanel.add("group");
        step1.add("statictext", undefined, "1.");
        step1.add("statictext", undefined, "访问 https://api.fanyi.baidu.com/");
        
        var step2 = stepsPanel.add("group");
        step2.add("statictext", undefined, "2.");
        step2.add("statictext", undefined, "获取appId和apiKey");
        
        var step3 = stepsPanel.add("group");
        step3.add("statictext", undefined, "3.");
        step3.add("statictext", undefined, "将appId和apiKey填入下方");
        
        // APP ID输入
        var appIdGroup = translateDialog.add("group");
        appIdGroup.add("statictext", undefined, "appId:");
        var appIdInput = appIdGroup.add("edittext", undefined, translateSettings.appId ? "****" + translateSettings.appId.substr(-4) : "");
        appIdInput.preferredSize.width = 300;
        
        // API密钥输入
        var apiKeyGroup = translateDialog.add("group");
        apiKeyGroup.add("statictext", undefined, "apiKey:");
        var apiKeyInput = apiKeyGroup.add("edittext", undefined, translateSettings.apiKey ? "****" + translateSettings.apiKey.substr(-4) : "");
        apiKeyInput.preferredSize.width = 300;
        
        // 翻译开关
        var translateSwitchGroup = translateDialog.add("group");
        translateSwitchGroup.orientation = "column";
        translateSwitchGroup.alignChildren = "left";
        translateSwitchGroup.spacing = 5;
        
        var enableTranslateCheckbox = translateSwitchGroup.add("checkbox", undefined, "启用自动翻译为英文发送提示词");
        enableTranslateCheckbox.value = translateSettings.enableTranslate || false;
        
        // 如果API配置不完整，禁用翻译开关
        if (!translateSettings.appId || !translateSettings.apiKey) {
            enableTranslateCheckbox.enabled = false;
        }
        
        // 当API配置完成后，自动启用翻译开关
        appIdInput.onChanging = function() {
            if (appIdInput.text && appIdInput.text.indexOf("****") === -1 && 
                apiKeyInput.text && apiKeyInput.text.indexOf("****") === -1) {
                enableTranslateCheckbox.enabled = true;
            }
        };
        
        apiKeyInput.onChanging = function() {
            if (appIdInput.text && appIdInput.text.indexOf("****") === -1 && 
                apiKeyInput.text && apiKeyInput.text.indexOf("****") === -1) {
                enableTranslateCheckbox.enabled = true;
            }
        };
        
        var infoPanel = translateDialog.add("panel", undefined, "使用说明");
        infoPanel.orientation = "column";
        infoPanel.alignChildren = "left";
        infoPanel.spacing = 3;
        
        infoPanel.add("statictext", undefined, "• 自动将中文提示词翻译为英文");
        infoPanel.add("statictext", undefined, "• 提高AI对提示词的理解准确性");
        infoPanel.add("statictext", undefined, "• 翻译服务由百度提供");
        
        var btnGroup = translateDialog.add("group");
        btnGroup.alignment = "center";
        
        var testBtn = btnGroup.add("button", undefined, "测试连接");
        var updateBtn = btnGroup.add("button", undefined, "保存设置");
        var cancelBtn = btnGroup.add("button", undefined, "取消");
        
        // 处理现有设置显示
        appIdInput.onActivate = function() {
            if (appIdInput.text.indexOf("****") === 0 && translateSettings.appId) {
                appIdInput.text = translateSettings.appId;
            }
        };
        
        apiKeyInput.onActivate = function() {
            if (apiKeyInput.text.indexOf("****") === 0 && translateSettings.apiKey) {
                apiKeyInput.text = translateSettings.apiKey;
            }
        };
        
        testBtn.onClick = function() {
            var testAppId = appIdInput.text;
            var testApiKey = apiKeyInput.text;
            
            // 如果显示的是星号隐藏的文本，使用原有值进行测试
            if (testAppId.indexOf("****") === 0) {
                testAppId = translateSettings.appId;
            }
            
            if (testApiKey.indexOf("****") === 0) {
                testApiKey = translateSettings.apiKey;
            }
            
            if (!testAppId || testAppId.length < 5) {
                alert("请输入完整的appId。");
                return;
            }
            
            if (!testApiKey || testApiKey.length < 5) {
                alert("请输入完整的apiKey。");
                return;
            }
            
            // 测试翻译API
            var testResult = testBaiduTranslate(testAppId, testApiKey);
            if (testResult.success) {
                alert("✅ " + testResult.message);
            } else {
                alert("❌ " + testResult.message);
            }
        };
        
        updateBtn.onClick = function() {
            var newAppId = appIdInput.text;
            var newApiKey = apiKeyInput.text;
            
            // 如果显示的是星号隐藏的文本，说明用户没有修改，使用原有值
            if (newAppId.indexOf("****") === 0) {
                newAppId = translateSettings.appId;
            }
            
            if (newApiKey.indexOf("****") === 0) {
                newApiKey = translateSettings.apiKey;
            }
            
            // 检查是否有有效的appId和apiKey   
            if (!newAppId || newAppId.length < 5) {
                alert("请输入完整的appId。");
                return;
            }
            
            if (!newApiKey || newApiKey.length < 5) {
                alert("请输入完整的apiKey。");
                return;
            }
            
            translateSettings.appId = newAppId;
            translateSettings.apiKey = newApiKey;
            translateSettings.enableTranslate = enableTranslateCheckbox.value;
            saveTranslateSettings(translateSettings);
            
            translateDialog.close(1);
            alert("翻译设置保存成功！");
        };
        
        cancelBtn.onClick = function() {
            translateDialog.close(0);
        };
        
        translateDialog.show();
    }
    
    // 描述设置对话框
    function showDescSettingsDialog() {
        var descDialog = new Window("dialog", "描述设置");
        descDialog.orientation = "column";
        descDialog.alignChildren = "fill";
        descDialog.spacing = 10;
        descDialog.margins = 16;
        
        // 标题
        var titleGroup = descDialog.add("group");
        titleGroup.add("statictext", undefined, "描述设置");
        titleGroup.add("statictext", undefined, "").preferredSize.height = 5;
        
        // 描述输入
        var descGroup = descDialog.add("group");
        descGroup.orientation = "column";
        descGroup.alignChildren = "fill";
        descGroup.spacing = 5;
        
        descGroup.add("statictext", undefined, "固定描述(英文):");
        var descInput = descGroup.add("edittext", undefined, descSettings.fixedDesc || "", {multiline: true});
        descInput.preferredSize.height = 120;
        descInput.preferredSize.width = 400;
        
        // 启用固定描述选项
        var enableGroup = descDialog.add("group");
        enableGroup.orientation = "column";
        enableGroup.alignChildren = "left";
        enableGroup.spacing = 5;
        
        var enableFixedDescCheckbox = enableGroup.add("checkbox", undefined, "启用固定描述(英文)");
        enableFixedDescCheckbox.value = descSettings.enableFixedDesc || false;
        
        // 备注说明
        var noteGroup = descDialog.add("group");
        noteGroup.orientation = "column";
        noteGroup.alignChildren = "left";
        noteGroup.spacing = 3;
        
        var noteText = noteGroup.add("statictext", undefined, "备注：启用固定描述每次生成都会使用上方固定描述");
        noteText.characters = 50;
        
        // 按钮组
        var btnGroup = descDialog.add("group");
        btnGroup.alignment = "center";
        
        var saveBtn = btnGroup.add("button", undefined, "保存");
        var cancelBtn = btnGroup.add("button", undefined, "取消");
        
        saveBtn.onClick = function() {
            var newFixedDesc = descInput.text;
            var newEnableFixedDesc = enableFixedDescCheckbox.value;
            
            descSettings.fixedDesc = newFixedDesc;
            descSettings.enableFixedDesc = newEnableFixedDesc;
            saveDescSettings(descSettings);
            
            // 更新主界面输入框状态
            updatePromptInputState();
            
            descDialog.close(1);
            alert("描述设置保存成功！");
        };
        
        cancelBtn.onClick = function() {
            descDialog.close(0);
        };
        
        descDialog.show();
    }
    
    // 更新主界面输入框状态
    function updatePromptInputState() {
        if (descSettings.enableFixedDesc && descSettings.fixedDesc) {
            // 启用固定描述时，隐藏输入框，显示提示文本
            promptLabel.visible = false;
            promptText.visible = false;
            fixedDescNotice.visible = true;
        } else {
            // 禁用固定描述时，显示输入框，隐藏提示文本
            promptLabel.visible = true;
            promptText.visible = true;
            fixedDescNotice.visible = false;
            
            // 恢复可编辑状态
            promptText.enabled = true;
            // 恢复默认文字颜色
            try {
                var blackBrush = promptText.graphics.newBrush(promptText.graphics.BrushType.SOLID_COLOR, [0, 0, 0]);
                promptText.graphics.foregroundColor = blackBrush;
            } catch (e) {
                // 如果颜色设置失败，忽略错误
            }
            if (!descSettings.fixedDesc) {
                promptText.text = "Change the background color of the image to white gradually to green";
            }
        }
    }
    
    // 简化的测试百度翻译API函数 - 使用Socket POST方法
    function testBaiduTranslate(appId, apiKey) {
        try {
            var testText = "你好，这是一条测试消息。";
            
            // 直接使用Socket POST方法测试
            var translatedText = translateWithSocket(testText, appId, apiKey);
            
            return {
                success: true,
                message: "百度翻译API连接成功! 翻译示例: \"" + testText + "\" => \"" + translatedText + "\""
            };
            
        } catch (e) {
            var errorMsg = "百度翻译API连接失败: " + e.message + "\n\n";
            errorMsg += "请检查以下问题：\n";
            errorMsg += "1. 网络连接是否正常\n";
            errorMsg += "2. appId和apiKey是否正确\n";
            errorMsg += "3. 是否已开通翻译服务\n";
            errorMsg += "4. 防火墙是否阻止了网络请求\n";
            errorMsg += "5. 是否在公司网络环境（可能需要代理）\n\n";
            errorMsg += "建议解决方案：\n";
            errorMsg += "• 检查网络连接后重试\n";
            errorMsg += "• 确认百度翻译控制台中服务已开启\n";
            errorMsg += "• 验证appId和apiKey无误\n";
            errorMsg += "• 如在企业网络，联系网管确认网络策略";
            
            return { 
                success: false, 
                message: errorMsg
            };
        }
    }
    
    // 自定义trim函数（兼容ExtendScript）
    function trimString(str) {
        return str.replace(/^\s+|\s+$/g, '');
    }

    // Socket POST翻译方法（参考baidu.jsx的成功实现）
    function translateWithSocket(query, appid, key) {
        var salt = (new Date).getTime();
        var from = 'zh';
        var to = 'en';
        
        // 生成签名
        var str1 = appid + query + salt + key;
        var sign = generateMD5(str1);
        
        // 构建POST数据
        var postData = "q=" + encodeURIComponent(query) + 
                       "&from=" + from + 
                       "&to=" + to + 
                       "&appid=" + appid + 
                       "&salt=" + salt + 
                       "&sign=" + sign;
        
        try {
            var request = new Socket();
            var host = "fanyi-api.baidu.com";
            var port = 80; // 使用HTTP端口
            
            request.timeout = 5000;
            
            if (!request.open(host + ":" + port)) {
                throw new Error('无法连接到翻译服务器');
            }
            
            // 构建HTTP POST请求
            var httpRequest = "POST /api/trans/vip/translate HTTP/1.1\r\n" +
                             "Host: " + host + "\r\n" +
                             "Content-Type: application/x-www-form-urlencoded\r\n" +
                             "Content-Length: " + postData.length + "\r\n" +
                             "Connection: close\r\n" +
                             "User-Agent: ExtendScript\r\n" +
                             "\r\n" +
                             postData;
            
            request.write(httpRequest);
            
            // 读取响应
            var response = "";
            var maxAttempts = 20;
            
            for (var i = 0; i < maxAttempts; i++) {
                var chunk = request.read();
                if (chunk !== null) {
                    response += chunk;
                    // 检查是否收到完整的HTTP响应
                    if (response.indexOf("\r\n\r\n") !== -1) {
                        var headerEnd = response.indexOf("\r\n\r\n");
                        var body = response.substring(headerEnd + 4);
                        if (body.length > 0 && body.indexOf("{") !== -1) {
                            break;
                        }
                    }
                }
                $.sleep(100);
            }
            
            request.close();
            
            if (!response) {
                throw new Error('服务器无响应');
            }
            
            // 解析HTTP响应
            var headerEnd = response.indexOf("\r\n\r\n");
            if (headerEnd === -1) {
                // 尝试其他分隔符
                headerEnd = response.indexOf("\n\n");
                if (headerEnd === -1) {
                    throw new Error('无效的HTTP响应格式');
                } else {
                    var body = response.substring(headerEnd + 2);
                }
            } else {
                var body = response.substring(headerEnd + 4);
            }
            
            if (!body || trimString(String(body)).length === 0) {
                throw new Error('响应体为空');
            }
            
            // 解析JSON - 使用更安全的方法
            var jsonResponse;
            var bodyStr = String(body);
            try {
                // 先尝试使用eval
                jsonResponse = eval('(' + bodyStr + ')');
            } catch (evalError) {
                // 如果eval失败，尝试简单的JSON解析
                try {
                    // 简单的JSON解析实现
                    var cleanBody = trimString(bodyStr);
                    if (cleanBody.indexOf('{') === 0 && cleanBody.lastIndexOf('}') === cleanBody.length - 1) {
                        jsonResponse = eval('(' + cleanBody + ')');
                    } else {
                        throw new Error('无效的JSON格式');
                    }
                } catch (parseError) {
                    throw new Error('JSON解析失败: ' + parseError.message);
                }
            }
            
            if (jsonResponse.error_code) {
                throw new Error('翻译API错误: ' + jsonResponse.error_msg);
            }
            
            if (jsonResponse.trans_result && jsonResponse.trans_result.length > 0) {
                return jsonResponse.trans_result[0].dst;
            } else {
                throw new Error('翻译结果为空');
            }
            
        } catch (e) {
            throw new Error('Socket翻译失败: ' + e.message);
        }
    }

    // MD5实现 - 使用官方提供的MD5算法
    function generateMD5(string) {
        function RotateLeft(lValue, iShiftBits) {
            return (lValue<<iShiftBits) | (lValue>>>(32-iShiftBits));
        }
      
        function AddUnsigned(lX,lY) {
            var lX4,lY4,lX8,lY8,lResult;
            lX8 = (lX & 0x80000000);
            lY8 = (lY & 0x80000000);
            lX4 = (lX & 0x40000000);
            lY4 = (lY & 0x40000000);
            lResult = (lX & 0x3FFFFFFF)+(lY & 0x3FFFFFFF);
            if (lX4 & lY4) {
                return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
            }
            if (lX4 | lY4) {
                if (lResult & 0x40000000) {
                    return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
                } else {
                    return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
                }
            } else {
                return (lResult ^ lX8 ^ lY8);
            }
        }
      
        function F(x,y,z) { return (x & y) | ((~x) & z); }
        function G(x,y,z) { return (x & z) | (y & (~z)); }
        function H(x,y,z) { return (x ^ y ^ z); }
        function I(x,y,z) { return (y ^ (x | (~z))); }
      
        function FF(a,b,c,d,x,s,ac) {
            a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
            return AddUnsigned(RotateLeft(a, s), b);
        }
      
        function GG(a,b,c,d,x,s,ac) {
            a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
            return AddUnsigned(RotateLeft(a, s), b);
        }
      
        function HH(a,b,c,d,x,s,ac) {
            a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
            return AddUnsigned(RotateLeft(a, s), b);
        }
      
        function II(a,b,c,d,x,s,ac) {
            a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
            return AddUnsigned(RotateLeft(a, s), b);
        }
      
        function ConvertToWordArray(string) {
            var lWordCount;
            var lMessageLength = string.length;
            var lNumberOfWords_temp1=lMessageLength + 8;
            var lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1 % 64))/64;
            var lNumberOfWords = (lNumberOfWords_temp2+1)*16;
            var lWordArray=Array(lNumberOfWords-1);
            var lBytePosition = 0;
            var lByteCount = 0;
            while ( lByteCount < lMessageLength ) {
                lWordCount = (lByteCount-(lByteCount % 4))/4;
                lBytePosition = (lByteCount % 4)*8;
                lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount)<<lBytePosition));
                lByteCount++;
            }
            lWordCount = (lByteCount-(lByteCount % 4))/4;
            lBytePosition = (lByteCount % 4)*8;
            lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80<<lBytePosition);
            lWordArray[lNumberOfWords-2] = lMessageLength<<3;
            lWordArray[lNumberOfWords-1] = lMessageLength>>>29;
            return lWordArray;
        }
      
        function WordToHex(lValue) {
            var WordToHexValue="",WordToHexValue_temp="",lByte,lCount;
            for (lCount = 0;lCount<=3;lCount++) {
                lByte = (lValue>>>(lCount*8)) & 255;
                WordToHexValue_temp = "0" + lByte.toString(16);
                WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length-2,2);
            }
            return WordToHexValue;
        }
      
        function Utf8Encode(string) {
            string = string.replace(/\r\n/g,"\n");
            var utftext = "";
            for (var n = 0; n < string.length; n++) {
                var c = string.charCodeAt(n);
                if (c < 128) {
                    utftext += String.fromCharCode(c);
                } else if((c > 127) && (c < 2048)) {
                    utftext += String.fromCharCode((c >> 6) | 192);
                    utftext += String.fromCharCode((c & 63) | 128);
                } else {
                    utftext += String.fromCharCode((c >> 12) | 224);
                    utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                    utftext += String.fromCharCode((c & 63) | 128);
                }
            }
            return utftext;
        }
      
        var x=Array();
        var k,AA,BB,CC,DD,a,b,c,d;
        var S11=7, S12=12, S13=17, S14=22;
        var S21=5, S22=9 , S23=14, S24=20;
        var S31=4, S32=11, S33=16, S34=23;
        var S41=6, S42=10, S43=15, S44=21;
        string = Utf8Encode(string);
        x = ConvertToWordArray(string);
        a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;
        for (k=0;k<x.length;k+=16) {
            AA=a; BB=b; CC=c; DD=d;
            a=FF(a,b,c,d,x[k+0], S11,0xD76AA478);
            d=FF(d,a,b,c,x[k+1], S12,0xE8C7B756);
            c=FF(c,d,a,b,x[k+2], S13,0x242070DB);
            b=FF(b,c,d,a,x[k+3], S14,0xC1BDCEEE);
            a=FF(a,b,c,d,x[k+4], S11,0xF57C0FAF);
            d=FF(d,a,b,c,x[k+5], S12,0x4787C62A);
            c=FF(c,d,a,b,x[k+6], S13,0xA8304613);
            b=FF(b,c,d,a,x[k+7], S14,0xFD469501);
            a=FF(a,b,c,d,x[k+8], S11,0x698098D8);
            d=FF(d,a,b,c,x[k+9], S12,0x8B44F7AF);
            c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1);
            b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE);
            a=FF(a,b,c,d,x[k+12],S11,0x6B901122);
            d=FF(d,a,b,c,x[k+13],S12,0xFD987193);
            c=FF(c,d,a,b,x[k+14],S13,0xA679438E);
            b=FF(b,c,d,a,x[k+15],S14,0x49B40821);
            a=GG(a,b,c,d,x[k+1], S21,0xF61E2562);
            d=GG(d,a,b,c,x[k+6], S22,0xC040B340);
            c=GG(c,d,a,b,x[k+11],S23,0x265E5A51);
            b=GG(b,c,d,a,x[k+0], S24,0xE9B6C7AA);
            a=GG(a,b,c,d,x[k+5], S21,0xD62F105D);
            d=GG(d,a,b,c,x[k+10],S22,0x2441453);
            c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681);
            b=GG(b,c,d,a,x[k+4], S24,0xE7D3FBC8);
            a=GG(a,b,c,d,x[k+9], S21,0x21E1CDE6);
            d=GG(d,a,b,c,x[k+14],S22,0xC33707D6);
            c=GG(c,d,a,b,x[k+3], S23,0xF4D50D87);
            b=GG(b,c,d,a,x[k+8], S24,0x455A14ED);
            a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905);
            d=GG(d,a,b,c,x[k+2], S22,0xFCEFA3F8);
            c=GG(c,d,a,b,x[k+7], S23,0x676F02D9);
            b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);
            a=HH(a,b,c,d,x[k+5], S31,0xFFFA3942);
            d=HH(d,a,b,c,x[k+8], S32,0x8771F681);
            c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122);
            b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C);
            a=HH(a,b,c,d,x[k+1], S31,0xA4BEEA44);
            d=HH(d,a,b,c,x[k+4], S32,0x4BDECFA9);
            c=HH(c,d,a,b,x[k+7], S33,0xF6BB4B60);
            b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);
            a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6);
            d=HH(d,a,b,c,x[k+0], S32,0xEAA127FA);
            c=HH(c,d,a,b,x[k+3], S33,0xD4EF3085);
            b=HH(b,c,d,a,x[k+6], S34,0x4881D05);
            a=HH(a,b,c,d,x[k+9], S31,0xD9D4D039);
            d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5);
            c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8);
            b=HH(b,c,d,a,x[k+2], S34,0xC4AC5665);
            a=II(a,b,c,d,x[k+0], S41,0xF4292244);
            d=II(d,a,b,c,x[k+7], S42,0x432AFF97);
            c=II(c,d,a,b,x[k+14],S43,0xAB9423A7);
            b=II(b,c,d,a,x[k+5], S44,0xFC93A039);
            a=II(a,b,c,d,x[k+12],S41,0x655B59C3);
            d=II(d,a,b,c,x[k+3], S42,0x8F0CCC92);
            c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D);
            b=II(b,c,d,a,x[k+1], S44,0x85845DD1);
            a=II(a,b,c,d,x[k+8], S41,0x6FA87E4F);
            d=II(d,a,b,c,x[k+15],S42,0xFE2CE6E0);
            c=II(c,d,a,b,x[k+6], S43,0xA3014314);
            b=II(b,c,d,a,x[k+13],S44,0x4E0811A1);
            a=II(a,b,c,d,x[k+4], S41,0xF7537E82);
            d=II(d,a,b,c,x[k+11],S42,0xBD3AF235);
            c=II(c,d,a,b,x[k+2], S43,0x2AD7D2BB);
            b=II(b,c,d,a,x[k+9], S44,0xEB86D391);
            a=AddUnsigned(a,AA);
            b=AddUnsigned(b,BB);
            c=AddUnsigned(c,CC);
            d=AddUnsigned(d,DD);
        }
      
        var temp = WordToHex(a)+WordToHex(b)+WordToHex(c)+WordToHex(d);
        return temp.toLowerCase();
    }
    
    // 简化的翻译文本函数 - 使用Socket POST方法
    function translateText(text) {
        if (!translateSettings.appId || !translateSettings.apiKey) {
            return text; // 如果没有配置翻译，返回原文
        }
        
        try {
            // 直接使用Socket POST方法，简单可靠
            return translateWithSocket(text, translateSettings.appId, translateSettings.apiKey);
        } catch (e) {
            // 翻译失败，返回原文
            return text;
        }
    }
    
    // 处理生成
    function processGeneration() {
        try {
            var doc = app.activeDocument;
            
            // 检查是否有选区
            var hasSelection = false;
            var selectionBounds = null;
            
            try {
                selectionBounds = doc.selection.bounds;
                hasSelection = true;
            } catch(e) {
                hasSelection = false;
            }
            
            // 显示进度
            var progressWin = new Window("window", "zealman NanoBanana 生成中");
            progressWin.preferredSize.width = 400;
            progressWin.preferredSize.height = 150;
            progressWin.orientation = "column";
            progressWin.alignChildren = "center";
            progressWin.spacing = 10;
            progressWin.margins = 16;
            
            
            var statusText = progressWin.add("statictext", undefined, "准备图片中...");
            statusText.preferredSize.width = 350;
            
            var detailText = progressWin.add("statictext", undefined, hasSelection ? "处理选中区域" : "处理整个图像");
            detailText.preferredSize.width = 350;
            progressWin.center();
            progressWin.show();
            progressWin.update();
            
            // 导出图片和蒙版
            statusText.text = "导出图片中...";
            progressWin.update();
            
            var imageFile = exportImage(doc, hasSelection ? selectionBounds : null);
            
            
            if (!imageFile || !imageFile.exists) {
                progressWin.close();
                alert("导出图片失败。");
                return;
            }
            
            // 准备最终提示词
            var finalPrompt;
            
            // 检查是否启用了固定描述
            if (descSettings.enableFixedDesc && descSettings.fixedDesc) {
                // 使用固定描述，跳过翻译
                finalPrompt = descSettings.fixedDesc;
                statusText.text = "使用固定描述";
                detailText.text = "已启用固定描述模式";
                progressWin.update();
            } else {
                // 使用主界面输入，可能需要翻译
                finalPrompt = promptText.text;
                
                // 如果启用了翻译功能，先翻译提示词
                if (translateSettings.enableTranslate && translateSettings.appId && translateSettings.apiKey) {
                    statusText.text = "翻译提示词中...";
                    detailText.text = "正在将中文翻译为英文";
                    progressWin.update();
                    
                    var translatedPrompt = translateText(finalPrompt);
                    if (translatedPrompt !== finalPrompt) {
                        finalPrompt = translatedPrompt;
                        // 在进度窗口中显示翻译结果，而不是弹窗
                        statusText.text = "翻译完成";
                        detailText.text = "已翻译为英文: " + translatedPrompt;
                        progressWin.update();
                        // 等待2秒让用户看到翻译结果
                        $.sleep(2000);
                    }
                }
            }
            
            // 添加明确的图像生成指令，提高图像输出概率
            if (hasSelection) {
                finalPrompt = "Generate a new image, modify the selected area: " + finalPrompt + "\n\nImportant: Must return the generated image, not just text description.";
            } else {
                finalPrompt = "Generate a new image, process the entire image: " + finalPrompt + "\n\nImportant: Must return the generated image, not just text description.";
            }
            
            // 调用BizyAir API  
            statusText.text = "调用API，弹出cmd窗口不用管会自己关闭";
            detailText.text = "正在处理，预计10-20秒";
            progressWin.update();
            
            var responseText = callBizyAirAPI(
                finalPrompt,
                imageFile,
                progressWin,
                statusText,
                detailText
            );
            
            if (!responseText) {
                progressWin.close();
                return;
            }
            
            progressWin.close();
            
            // 智能响应处理：优先寻找图像，忽略无价值文本
            if (responseText) {
                var resultFile = downloadBizyAirResult(responseText);
                
                if (resultFile && resultFile.exists) {
                    if (outputNewDoc.value) {
                        // 在新文档中打开
                        app.open(resultFile);
                        alert("图片生成成功！已在新文档中打开。");
                    } else {
                        // 放置到当前文档
                        placeResultInDocument(doc, resultFile, selectionBounds, finalPrompt);
                    }
                    resultFile.remove();
                } else {
                    // 显示API实际响应内容进行调试
                    var debugDialog = new Window("dialog", "API响应调试");
                    debugDialog.orientation = "column";
                    debugDialog.alignChildren = "fill";
                    debugDialog.spacing = 10;
                    debugDialog.margins = 16;
                    debugDialog.preferredSize.width = 600;
                    debugDialog.preferredSize.height = 400;
                    
                    debugDialog.add("statictext", undefined, "BizyAir API响应内容：");
                    
                    // 显示完整的API响应
                    var responsePanel = debugDialog.add("panel", undefined, "原始响应");
                    responsePanel.orientation = "column";
                    responsePanel.alignChildren = "fill";
                    
                    var responseText_display = responsePanel.add("edittext", undefined, responseText, {multiline: true, readonly: true});
                    responseText_display.preferredSize.height = 250;
                    responseText_display.preferredSize.width = 550;
                    
                    // 解析响应进行分析
                    var analysisPanel = debugDialog.add("panel", undefined, "响应分析");
                    analysisPanel.orientation = "column";
                    analysisPanel.alignChildren = "left";
                    
                    try {
                        var jsonResponse = eval('(' + responseText + ')');
                        analysisPanel.add("statictext", undefined, "• JSON解析: 成功");
                        analysisPanel.add("statictext", undefined, "• 状态: " + (jsonResponse.status || "未知"));
                        
                        if (jsonResponse.outputs && jsonResponse.outputs.length > 0 && jsonResponse.outputs[0].object_url) {
                            analysisPanel.add("statictext", undefined, "• Object URL: " + jsonResponse.outputs[0].object_url.substring(0, 50) + "...");
                        } else if (jsonResponse.object_url) {
                            analysisPanel.add("statictext", undefined, "• Object URL: " + jsonResponse.object_url.substring(0, 50) + "...");
                        } else {
                            analysisPanel.add("statictext", undefined, "• Object URL: 未找到");
                        }
                        
                        if (jsonResponse.outputs) {
                            analysisPanel.add("statictext", undefined, "• Outputs数组长度: " + jsonResponse.outputs.length);
                        }
                        
                        // 显示所有可用字段
                        var fields = [];
                        for (var key in jsonResponse) {
                            if (jsonResponse.hasOwnProperty(key)) {
                                fields.push(key);
                            }
                        }
                        analysisPanel.add("statictext", undefined, "• 可用字段: " + fields.join(", "));
                        
                    } catch (e) {
                        analysisPanel.add("statictext", undefined, "• JSON解析: 失败 - " + e.toString());
                    }
                    
                    var btnGroup = debugDialog.add("group");
                    btnGroup.alignment = "center";
                    var retryBtn = btnGroup.add("button", undefined, "重试");
                    var closeBtn = btnGroup.add("button", undefined, "关闭");
                    retryBtn.onClick = function() {
                        debugDialog.close(1);
                        // 直接重新调用API，使用相同的参数
                        var retryProgress = new Window("window", "重新生成中...");
                        retryProgress.add("statictext", undefined, "正在重试，请稍候...");
                        retryProgress.center();
                        retryProgress.show();
                        
                        var retryResponse = callBizyAirAPI(finalPrompt, imageFile, null, null, null);
                        retryProgress.close();
                        
                        if (retryResponse) {
                            var retryFile = downloadBizyAirResult(retryResponse);
                            if (retryFile && retryFile.exists) {
                                if (outputNewDoc.value) {
                                    app.open(retryFile);
                                    alert("重试成功！图片已生成。");
                                } else {
                                    placeResultInDocument(doc, retryFile, selectionBounds, finalPrompt);
                                }
                                retryFile.remove();
                            } else {
                                alert("重试仍未生成图像。请查看调试信息。");
                            }
                        }
                    };
                    
                    closeBtn.onClick = function() {
                        debugDialog.close(0);
                    };
                    
                    debugDialog.show();
                }
            } else {
                alert("API调用失败，未收到响应");
            }
            
            // 清理临时文件
            if (imageFile && imageFile.exists) imageFile.remove();
            
        } catch(err) {
            alert("错误: " + err.toString() + "\n行号: " + err.line);
        }
    }
    
    // 简化的图片导出函数
    function exportImage(doc, bounds) {
        try {
            var timestamp = new Date().getTime();
            var tempFile = new File(Folder.temp + "/flux_input_" + timestamp + ".jpg");
            
            if (bounds) {
                // 复制选区
                doc.selection.deselect();
                doc.artLayers.add();
                var tempLayer = doc.activeLayer;
                tempLayer.name = "Temp Merged";

                selectAll();
                copyMerged();
                doc.paste();

                var cropDoc = doc.duplicate("temp_crop", true);
                cropDoc.crop([bounds[0], bounds[1], bounds[2], bounds[3]]);

                var saveOptions = new JPEGSaveOptions();
                saveOptions.quality = 10;
                cropDoc.saveAs(tempFile, saveOptions, true, Extension.LOWERCASE);

                cropDoc.close(SaveOptions.DONOTSAVECHANGES);

                doc.activeLayer = tempLayer;
                tempLayer.remove();
            } else {
                // 保存整个文档
                var tempDoc = doc.duplicate();
                tempDoc.flatten();
                
                // 简单调整大小（如果太大）
                if (tempDoc.width.as('px') > 2048 || tempDoc.height.as('px') > 2048) {
                    if (tempDoc.width > tempDoc.height) {
                        tempDoc.resizeImage(UnitValue(2048, "px"), null, null, ResampleMethod.BICUBIC);
                    } else {
                        tempDoc.resizeImage(null, UnitValue(2048, "px"), null, ResampleMethod.BICUBIC);
                    }
                }
                
                var saveOptions = new JPEGSaveOptions();
                saveOptions.quality = 10;
                tempDoc.saveAs(tempFile, saveOptions, true, Extension.LOWERCASE);
                tempDoc.close(SaveOptions.DONOTSAVECHANGES);
            }
            
            return tempFile;

        } catch (e) {
            alert("导出图片时出错: " + e.toString());
            return null;
        }
    }
    
    // 添加必要的辅助函数
    function selectAll() {
        app.activeDocument.selection.selectAll();
    }

    function copyMerged() {
        var idCpyM = charIDToTypeID("CpyM");
        executeAction(idCpyM, undefined, DialogModes.NO);
    }
    
    
    
    // BizyAir API响应处理函数
    function downloadBizyAirResult(response) {
        try {
            // 解析BizyAir API响应
            var json = null;
            try { json = eval('(' + response + ')'); } catch (e) { json = null; }

            var imageUrl = null;

            // 1) BizyAir API响应格式解析 - 根据实际API响应格式
            if (json && json.status === "Success") {
                // BizyAir API返回outputs数组，每个元素包含object_url
                if (json.outputs && json.outputs.length > 0 && json.outputs[0].object_url) {
                    imageUrl = json.outputs[0].object_url;
                }
                // 兼容旧格式：直接在根级别的object_url
                else if (json.object_url && typeof json.object_url === "string") {
                    imageUrl = json.object_url;
                }
                // 兼容其他可能的字段
                else if (json.output && typeof json.output === "string") {
                    if (json.output.indexOf("data:image/") !== -1) {
                        imageUrl = json.output;
                    } else if (json.output.indexOf("http") !== -1) {
                        imageUrl = json.output;
                    }
                } else if (json.result && json.result.output_images) {
                    var outputImages = json.result.output_images;
                    if (outputImages.length > 0) {
                        imageUrl = outputImages[0];
                    }
                }
            }
            
            // 2) 处理任务状态响应
            if (json && json.task_id && !imageUrl) {
                // 如果返回任务ID，说明任务正在处理中
                alert("任务已提交，任务ID: " + json.task_id + "\n请稍后查看结果。");
                return null;
            }

            // 2) 在原始文本中搜索
            if (!imageUrl && typeof response === "string") {
                // 首先搜索outputs数组中的object_url字段
                var outputsUrlMatch = response.match(/"outputs"\s*:\s*\[\s*\{[^}]*"object_url"\s*:\s*"([^"]+)"/);
                if (outputsUrlMatch && outputsUrlMatch[1]) {
                    imageUrl = outputsUrlMatch[1];
                } else {
                    // 搜索简单的object_url字段
                    var objectUrlMatch = response.match(/"object_url"\s*:\s*"([^"]+)"/);
                    if (objectUrlMatch && objectUrlMatch[1]) {
                        imageUrl = objectUrlMatch[1];
                    } else {
                        // 搜索data URI
                        var dataUriRe2 = new RegExp("(data:image\\/[A-Za-z0-9+]+;base64,[A-Za-z0-9+\\/=]+)");
                        var m3 = dataUriRe2.exec(response);
                        if (m3 && m3[1]) {
                            imageUrl = m3[1];
                        } else {
                            // 搜索HTTP URL
                            var urlRe2 = new RegExp("https?:\\/\\/[^\"']+\\.(?:jpg|jpeg|png|webp)(?:\\?[^\"'\\s]*)?", "i");
                            var m4 = urlRe2.exec(response);
                            if (m4 && m4[0]) imageUrl = m4[0];
                        }
                    }
                }
            }

            // 如果没有找到图像，显示调试信息
            if (!imageUrl) {
                var debugMsg = "🔍 未能提取图像结果，调试信息：\n\n";
                if (json) {
                    debugMsg += "解析成功的JSON响应：\n";
                    debugMsg += "• 状态: " + (json.status || "未知") + "\n";
                    debugMsg += "• 任务ID: " + (json.request_id || json.task_id || "无") + "\n";
                    
                    // 列出所有可用字段
                    debugMsg += "• 可用字段: ";
                    var fields = [];
                    for (var key in json) {
                        if (json.hasOwnProperty(key)) {
                            fields.push(key + "(" + typeof json[key] + ")");
                        }
                    }
                    debugMsg += fields.join(", ") + "\n\n";
                    
                    // 显示关键字段内容
                    if (json.outputs && json.outputs.length > 0 && json.outputs[0].object_url) {
                        debugMsg += "Object URL (outputs[0]): " + json.outputs[0].object_url.substring(0, 100) + "...\n\n";
                    } else if (json.object_url) {
                        debugMsg += "Object URL: " + json.object_url.substring(0, 100) + "...\n\n";
                    }
                    if (json.output) {
                        debugMsg += "Output字段内容: " + json.output.substring(0, 100) + "...\n\n";
                    }
                } else {
                    debugMsg += "JSON解析失败\n";
                    debugMsg += "原始响应: " + response.substring(0, 200) + "...\n\n";
                }
                // 静默返回null，让主逻辑处理调试显示
                return null;
            }

            // 3) 下载/转换结果到临时文件
            var timestamp = new Date().getTime();
            var resultFile = new File(Folder.temp + "/openrouter_result_" + timestamp + ".jpg");

            if (imageUrl.indexOf("data:image/") === 0) {
                // data URI转换
                var b64file = new File(Folder.temp + "/tmp_b64_" + timestamp + ".txt");
                b64file.open("w");
                b64file.write(imageUrl.replace(/^data:image\/[A-Za-z0-9+]+;base64,/, ""));
                b64file.close();

                if ($.os.indexOf("Windows") !== -1) {
                    var decCmd = 'cmd.exe /c certutil -decode "' + b64file.fsName + '" "' + resultFile.fsName + '"';
                    app.system(decCmd);
                } else {
                    var decCmd = '/bin/sh -c \'base64 -d "' + b64file.fsName + '" > "' + resultFile.fsName + '"\'';
                    app.system(decCmd);
                }
                b64file.remove();
            } else {
                // 直接URL下载
                var curlCmd = 'curl -s -L "' + imageUrl + '" > "' + resultFile.fsName + '"';
                var isWindows = $.os.indexOf("Windows") !== -1;
                if (isWindows) {
                    app.system('cmd.exe /c ' + curlCmd);
                } else {
                    app.system('/bin/sh -c \'' + curlCmd + '\'');
                }
            }

            if (resultFile.exists && resultFile.length > 0) {
                return resultFile;
            }
            return null;

        } catch (e) {
            return null;
        }
    }
    
    // 功图片放置方法
    function placeResultInDocument(doc, resultFile, selectionBounds, prompt) {
        try {
            var resultDoc = app.open(resultFile);

            resultDoc.artLayers[0].duplicate(doc, ElementPlacement.PLACEATBEGINNING);
            resultDoc.close(SaveOptions.DONOTSAVECHANGES);

            var newLayer = doc.artLayers[0];
            newLayer.name = "zealman-nanobanana";

            if (selectionBounds) {
                var x1 = Math.round(selectionBounds[0].value);
                var y1 = Math.round(selectionBounds[1].value);
                var x2 = Math.round(selectionBounds[2].value);
                var y2 = Math.round(selectionBounds[3].value);
                
                var targetWidth = x2 - x1;
                var targetHeight = y2 - y1;

                var currentBounds = newLayer.bounds;
                var currentWidth = currentBounds[2].value - currentBounds[0].value;
                var currentHeight = currentBounds[3].value - currentBounds[1].value;

                if (Math.abs(currentWidth - targetWidth) > 1 || Math.abs(currentHeight - targetHeight) > 1) {
                    var scaleX = (targetWidth / currentWidth) * 100;
                    var scaleY = (targetHeight / currentHeight) * 100;
                    var uniformScale = Math.min(scaleX, scaleY);
                    newLayer.resize(uniformScale, uniformScale, AnchorPosition.TOPLEFT);
                }

                var finalBounds = newLayer.bounds;
                var finalWidth = finalBounds[2].value - finalBounds[0].value;
                var finalHeight = finalBounds[3].value - finalBounds[1].value;

                var centerX = x1 + (targetWidth / 2);
                var centerY = y1 + (targetHeight / 2);

                var currentCenterX = finalBounds[0].value + (finalWidth / 2);
                var currentCenterY = finalBounds[1].value + (finalHeight / 2);

                var dx = centerX - currentCenterX;
                var dy = centerY - currentCenterY;

                newLayer.translate(dx, dy);
            }

            alert("图片生成完成！");

        } catch (e) {
            alert("放置图片时出错: " + e.toString());
        }
    }
    
    // addLayerMask函数
    function addLayerMask() {
        try {
            var idMk = charIDToTypeID("Mk  ");
            var desc = new ActionDescriptor();
            var idNw = charIDToTypeID("Nw  ");
            var idChnl = charIDToTypeID("Chnl");
            desc.putClass(idNw, idChnl);
            var idAt = charIDToTypeID("At  ");
            var ref = new ActionReference();
            var idChnl2 = charIDToTypeID("Chnl");
            var idChnl3 = charIDToTypeID("Chnl");
            var idMsk = charIDToTypeID("Msk ");
            ref.putEnumerated(idChnl2, idChnl3, idMsk);
            desc.putReference(idAt, ref);
            var idUsng = charIDToTypeID("Usng");
            var idUsrM = charIDToTypeID("UsrM");
            var idRvlS = charIDToTypeID("RvlS");
            desc.putEnumerated(idUsng, idUsrM, idRvlS);
            executeAction(idMk, desc, DialogModes.NO);
        } catch (e) {}
    }
    
    
    // 初始化 - 检查API密钥
    if (!apiKey) {
        showSettingsDialog();
        if (apiKey) {
            // 初始化输入框状态
            updatePromptInputState();
            mainDialog.show();
        }
    } else {
        // 初始化输入框状态
        updatePromptInputState();
        mainDialog.show();
    }
}