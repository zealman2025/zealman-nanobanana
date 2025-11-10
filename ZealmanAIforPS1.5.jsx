// ZealmanAIforPS1.5 基础免费版 图像处理插件 for Photoshop

#target photoshop;

// 主程序入口
try {
    // 检查Photoshop版本
    var psVersion = parseFloat(app.version);
    if (psVersion < 14.0) {
        alert("此插件需要Photoshop CS6 (14.0) 或更高版本。\n当前版本: " + app.version);
        throw new Error("Photoshop版本过低");
    }

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
    var apiModeSettingsFile = new File(scriptDataFolder + "/api_mode_settings.txt");
    var promptSettingsFile = new File(scriptDataFolder + "/prompt_settings.txt");
    var logFile = new File(scriptDataFolder + "/logs.txt");
    var apiKey = loadAPIKey();
    var translateSettings = loadTranslateSettings();
    var promptSettings = loadPromptSettings();

    // 日志系统
    var logMessages = [];

    function addLog(type, message) {
        var timestamp = new Date().toLocaleString();
        var logEntry = "[" + timestamp + "] [" + type + "] " + message;
        logMessages.push(logEntry);

        // 保存到本地文件
        try {
            logFile.open("a"); // 追加模式
            logFile.writeln(logEntry);
            logFile.close();
        } catch (e) {
            // 如果写入失败，忽略错误
        }
    }

    function saveLogsToFile() {
        try {
            logFile.open("w");
            for (var i = 0; i < logMessages.length; i++) {
                logFile.writeln(logMessages[i]);
            }
            logFile.close();
            return true;
        } catch (e) {
            return false;
        }
    }

    function clearLogs() {
        logMessages = [];
        try {
            logFile.open("w");
            logFile.write("");
            logFile.close();
            return true;
        } catch (e) {
            return false;
        }
    }

    function copyLogsToClipboard() {
        var allLogs = logMessages.join("\n");
        // 在ExtendScript中，我们需要创建一个临时文件来实现复制功能
        try {
            var tempFile = new File(Folder.temp + "/zealman_logs_temp.txt");
            tempFile.open("w");
            tempFile.write(allLogs);
            tempFile.close();

            // 使用系统命令复制到剪贴板
            var isWindows = $.os.indexOf("Windows") !== -1;
            if (isWindows) {
                app.system('cmd.exe /c type "' + tempFile.fsName + '" | clip');
            } else {
                app.system('cat "' + tempFile.fsName + '" | pbcopy');
            }

            tempFile.remove();
            return true;
        } catch (e) {
            return false;
        }
    }

    // 初始化日志
    addLog("系统", "插件启动，版本 v1.1");
    
    // API配置 - BizyAir API
    var nanobananaWebAppId = 36239;
    var seedream4WebAppId = 36598;
    var apiEndpoint = "https://api.bizyair.cn/w/v1/webapp/task/openapi/create";
    
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
    


    // 加载API模式设置
    function loadApiModeSettings() {
        if (apiModeSettingsFile.exists) {
            apiModeSettingsFile.open('r');
            var content = apiModeSettingsFile.read();
            apiModeSettingsFile.close();
            try {
                var settings = eval('(' + content + ')');
                // 确保包含所有必要字段
                if (typeof settings.selectedMode === 'undefined') {
                    settings.selectedMode = "nanobanana"; // 默认值
                }
                return settings;
            } catch (e) {
                return { selectedMode: "nanobanana" };
            }
        }
        return { selectedMode: "nanobanana" };
    }

    // 保存API模式设置
    function saveApiModeSettings(settings) {
        apiModeSettingsFile.open('w');
        apiModeSettingsFile.write(JSON.stringify(settings));
        apiModeSettingsFile.close();
    }

    // 加载提示词设置
    function loadPromptSettings() {
        if (promptSettingsFile.exists) {
            promptSettingsFile.open('r');
            var content = promptSettingsFile.read();
            promptSettingsFile.close();
            try {
                var settings = eval('(' + content + ')');
                // 确保包含所有必要字段
                if (typeof settings.lastPrompt === 'undefined') {
                    settings.lastPrompt = "";
                }
                return settings;
            } catch (e) {
                return { lastPrompt: "" };
            }
        }
        return { lastPrompt: "" };
    }

    // 保存提示词设置
    function savePromptSettings(settings) {
        promptSettingsFile.open('w');
        promptSettingsFile.write(JSON.stringify(settings));
        promptSettingsFile.close();
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
    
    // HTTP请求函数 (用于BizyAir API调用) - 无cmd窗口版本
    function makeHttpRequest(url, method, headers, body) {
        try {
            var isWindows = $.os.indexOf("Windows") !== -1;

            if (isWindows) {
                // Windows: 使用WinHttp.WinHttpRequest对象，完全避免cmd窗口
                return makeHttpRequestWindows(url, method, headers, body);
            } else {
                // macOS/Linux: 使用curl（静默模式）
                return makeHttpRequestUnix(url, method, headers, body);
            }
        } catch (e) {
            addLog("错误", "HTTP请求失败: " + e.toString());
            return null;
        }
    }

    // Windows版本：使用WinHttp对象
    function makeHttpRequestWindows(url, method, headers, body) {
        try {
            addLog("网络", "使用WinHttp发送请求（无cmd窗口）");

            // 检查ActiveXObject是否可用
            if (typeof ActiveXObject === "undefined") {
                addLog("警告", "ActiveXObject不可用，回退到curl方式");
                return makeHttpRequestUnix(url, method, headers, body);
            }

            // 创建WinHttp对象
            var http = new ActiveXObject("WinHttp.WinHttpRequest.5.1");

            // 设置超时（毫秒）
            http.SetTimeouts(30000, 30000, 30000, 120000); // 连接30s，发送30s，接收120s

            // 打开连接
            http.Open(method, url, false); // false = 同步请求

            // 设置请求头
            for (var header in headers) {
                if (headers.hasOwnProperty(header)) {
                    http.SetRequestHeader(header, headers[header]);
                }
            }

            // 添加UTF-8编码支持（解决中文字符问题）
            http.SetRequestHeader("Content-Type", "application/json; charset=utf-8");

            // 发送请求
            if (body) {
                // 确保请求体使用UTF-8编码
                addLog("编码", "发送请求体，长度: " + body.length + " 字符");
                http.Send(body);
            } else {
                http.Send();
            }

            // 获取响应
            var response = http.ResponseText;
            addLog("网络", "WinHttp请求完成，状态码: " + http.Status);

            return response;

        } catch (e) {
            addLog("错误", "WinHttp请求失败: " + e.toString());
            // 如果WinHttp失败，回退到curl方式
            return makeHttpRequestUnix(url, method, headers, body);
        }
    }

    // Unix版本：使用curl（静默模式）
    function makeHttpRequestUnix(url, method, headers, body) {
        try {
            addLog("网络", "使用curl发送请求（静默模式）");

            // 创建临时文件存储请求数据和响应
            var timestamp = new Date().getTime();
            var requestFile = new File(Folder.temp + "/request_" + timestamp + ".json");
            var responseFile = new File(Folder.temp + "/response_" + timestamp + ".json");

            // 写入请求数据（使用UTF-8编码）
            if (body) {
                requestFile.open("w");
                requestFile.encoding = "UTF-8";  // 确保文件使用UTF-8编码
                requestFile.write(body);
                requestFile.close();
                addLog("编码", "请求文件已写入，使用UTF-8编码，大小: " + Math.round(body.length/1024) + "KB");
            }

            // 构建curl命令
            var curlCmd = 'curl -s --max-time 120 -X ' + method + ' "' + url + '"';

            // 添加UTF-8编码的Content-Type头
            curlCmd += ' -H "Content-Type: application/json; charset=utf-8"';

            // 添加其他请求头
            for (var header in headers) {
                if (headers.hasOwnProperty(header) && header.toLowerCase() !== "content-type") {
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
                // Windows回退模式：尽量隐藏窗口
                app.system('cmd.exe /c "' + curlCmd + '"');
            } else {
                // macOS/Linux: 标准执行方式
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
            addLog("错误", "curl请求失败: " + e.toString());
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

    // 优化的Base64编码函数 - 支持大文件和详细日志
    function encodeImageToBase64(file) {
        try {
            addLog("Base64", "开始编码文件: " + file.name + " (大小: " + Math.round(file.length / 1024) + " KB)");

            var timestamp = new Date().getTime();
            // 临时base64文件名
            var base64File = new File(Folder.temp + "/base64_tmp_" + timestamp + ".txt");

            // 使用基本命令，移除可能有问题的超时设置
            var cmd = getBase64Command(file.fsName, base64File.fsName);
            addLog("Base64", "执行编码命令: " + cmd);

            app.system(cmd);

            if (!base64File.exists) {
                addLog("错误", "Base64编码失败，输出文件不存在");
                alert("无法将图片转换为base64格式。请检查图片文件是否完整。");
                return null;
            }

            addLog("Base64", "开始读取Base64数据");
            base64File.open("r");
            var base64Data = base64File.read();
            base64File.close();
            base64File.remove();

            // 检查base64数据有效性
            if (!base64Data || base64Data.length < 100) {
                addLog("错误", "生成的Base64数据无效，长度: " + (base64Data ? base64Data.length : 0));
                alert("生成的base64数据无效。请检查图片格式。");
                return null;
            }

            // 清理Windows certutil的输出格式
            if ($.os.indexOf("Windows") !== -1) {
                base64Data = base64Data.replace(/-----BEGIN CERTIFICATE-----/g, "");
                base64Data = base64Data.replace(/-----END CERTIFICATE-----/g, "");
            }
            base64Data = base64Data.replace(/[\r\n\s]/g, "");

            addLog("Base64", "编码完成，Base64长度: " + Math.round(base64Data.length / 1024) + " KB");

            return base64Data;
        } catch (e) {
            addLog("错误", "Base64编码异常: " + e.toString());
            alert("Base64编码失败: " + e.toString() + "\n建议：尝试使用更小的图片文件。");
            return null;
        }
    }
    
    // BizyAir API调用方法 - 支持NanoBanana和Seedream4模式
    function callBizyAirAPI(promptText, imageFile, progressWin, statusText, detailText, apiMode) {
        try {
            addLog("API", "开始调用 " + apiMode + " API");

            // 1) 将图片转换为base64编码的data URI
            var imageBase64 = convertImageToBase64(imageFile, progressWin, statusText, detailText);

            // 如果转换失败，显示错误并返回
            if (!imageBase64) {
                addLog("错误", "图片转换为base64失败");
                alert("图片转换失败，无法继续API调用\n\n请检查：\n• 图片文件是否存在\n• 图片格式是否支持");
                return null;
            }

            // 2) 根据API模式构建不同的请求载荷
            var requestBody;
            var currentWebAppId;
            var actualWidth, actualHeight; // 声明在外部作用域以便调试使用

            // 记录Base64数据信息（只显示部分）
            var base64Preview = imageBase64.substring(0, 100) + "..." + imageBase64.substring(imageBase64.length - 50);
            var base64Size = Math.round(imageBase64.length / 1024);
            addLog("API", "Base64数据大小: " + base64Size + "KB, 预览: " + base64Preview);

            if (apiMode === "seedream4") {
                // Seedream4 API 请求体
                currentWebAppId = seedream4WebAppId;

                // 解析图像文件获取实际尺寸（图像已经在exportImage中压缩过）
                try {
                    var tempDoc = app.open(new File(imageFile));
                    actualWidth = Math.round(tempDoc.width.as('px'));  // 明确转换为像素并取整数
                    actualHeight = Math.round(tempDoc.height.as('px')); // 明确转换为像素并取整数
                    tempDoc.close(SaveOptions.DONOTSAVECHANGES);

                    addLog("API", "Seedream4使用已压缩图像尺寸: " + actualWidth + "x" + actualHeight);
                } catch(e) {
                    // 如果无法获取，使用默认值
                    actualWidth = 1024;
                    actualHeight = 1024;
                    addLog("警告", "无法获取压缩图像尺寸，使用默认值: " + actualWidth + "x" + actualHeight);
                }

                requestBody = {
                    "web_app_id": currentWebAppId,
                    "suppress_preview_output": false,
                    "input_values": {
                        "18:LoadImage.image": imageBase64,
                        "17:BizyAir_Seedream4.prompt": promptText,
                        "17:BizyAir_Seedream4.size": "Custom",
                        "17:BizyAir_Seedream4.custom_width": actualWidth.toString(),
                        "17:BizyAir_Seedream4.custom_height": actualHeight.toString()
                    }
                };

                // 记录发送给API的详细信息
                addLog("API", "Seedream4请求参数:");
                addLog("API", "  - 提示词: " + promptText);
                addLog("API", "  - 尺寸模式: Custom");
                addLog("API", "  - 宽度: " + actualWidth);
                addLog("API", "  - 高度: " + actualHeight);
                addLog("API", "  - WebApp ID: " + currentWebAppId);
            } else {
                // NanoBanana API 请求体 (默认)
                currentWebAppId = nanobananaWebAppId;

                // 为NanoBanana模式设置默认尺寸值（用于调试日志）
                actualWidth = "N/A";
                actualHeight = "N/A";

                requestBody = {
                    "web_app_id": currentWebAppId,
                    "suppress_preview_output": false,
                    "input_values": {
                        "18:LoadImage.image": imageBase64,
                        "22:BizyAir_NanoBanana.prompt": promptText
                    }
                };

                // 记录发送给API的详细信息
                addLog("API", "NanoBanana请求参数:");
                addLog("API", "  - 提示词: " + promptText);
                addLog("API", "  - WebApp ID: " + currentWebAppId);
            }

            var requestPayload = JSON.stringify(requestBody);

            // 检查中文字符编码
            var chineseCharCount = 0;
            for (var i = 0; i < promptText.length; i++) {
                var charCode = promptText.charCodeAt(i);
                if (charCode > 127) {  // 非ASCII字符
                    chineseCharCount++;
                }
            }

            if (chineseCharCount > 0) {
                addLog("编码", "检测到 " + chineseCharCount + " 个中文/特殊字符");
                addLog("编码", "原始提示词: " + promptText);
                addLog("编码", "JSON编码后: " + JSON.stringify(promptText));
            }

            // 详细记录完整的请求体数据（用于调试API问题）
            addLog("API详细", "=== 完整API请求数据 ===");
            addLog("API详细", "模式: " + apiMode);
            addLog("API详细", "URL: https://bizyair.com/api/v1/workflow/run");

            // 记录请求头
            addLog("API详细", "请求头:");
            addLog("API详细", "  Content-Type: application/json");
            addLog("API详细", "  Authorization: Bearer " + apiKey.substring(0, 20) + "...");

            // 记录完整请求体（将Base64数据截断显示）
            var logRequestBody = JSON.parse(JSON.stringify(requestBody)); // 深拷贝

            // 截断Base64数据用于日志显示
            if (apiMode === "seedream4") {
                var originalBase64 = logRequestBody.input_values["18:LoadImage.image"];
                logRequestBody.input_values["18:LoadImage.image"] = originalBase64.substring(0, 100) + "...[截断]...(" + Math.round(originalBase64.length/1024) + "KB)";
            } else {
                var originalBase64 = logRequestBody.input_values["18:LoadImage.image"];
                logRequestBody.input_values["18:LoadImage.image"] = originalBase64.substring(0, 100) + "...[截断]...(" + Math.round(originalBase64.length/1024) + "KB)";
            }

            // 记录完整的JSON结构
            var prettyJson = JSON.stringify(logRequestBody, null, 2);
            var jsonLines = prettyJson.split('\n');
            for (var i = 0; i < jsonLines.length; i++) {
                addLog("API详细", jsonLines[i]);
            }

            addLog("API详细", "=== 请求数据记录完成 ===");

            // 3) 发送BizyAir API请求
            var requestHeaders = {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + apiKey
            };

            // 记录即将发送的请求信息
            addLog("网络", "=== 开始发送API请求 ===");
            addLog("网络", "目标URL: " + apiEndpoint);
            addLog("网络", "请求方法: POST");
            addLog("网络", "请求体大小: " + Math.round(requestPayload.length / 1024) + "KB");
            addLog("网络", "最终提示词: " + promptText);
            addLog("网络", "API模式: " + apiMode);

            if (apiMode === "seedream4") {
                addLog("网络", "Seedream4参数 - 宽度: " + actualWidth + ", 高度: " + actualHeight);
            }

            var response = makeHttpRequest(apiEndpoint, "POST", requestHeaders, requestPayload);

            if (!response) {
                addLog("错误", apiMode + " API调用失败 - 无响应");
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
            addLog("网络", "=== 收到API响应 ===");
            addLog("网络", "响应长度: " + response.length + " 字符");
            addLog("网络", "响应大小: " + Math.round(response.length / 1024) + "KB");

            // 记录完整的API响应数据（格式化显示）
            addLog("响应详细", "=== 完整API响应数据 ===");
            try {
                // 尝试格式化JSON响应
                var responseObj = JSON.parse(response);
                var prettyResponse = JSON.stringify(responseObj, null, 2);
                var responseLines = prettyResponse.split('\n');
                for (var i = 0; i < responseLines.length; i++) {
                    addLog("响应详细", responseLines[i]);
                }
            } catch (e) {
                // 如果不是JSON，直接记录原始响应
                addLog("响应详细", "原始响应（非JSON格式）: " + response);
            }
            addLog("响应详细", "=== 响应数据记录完成 ===");

            try {
                var jsonResponse = eval('(' + response + ')');

                // 记录解析后的响应结构
                addLog("响应解析", "JSON解析成功");
                addLog("响应字段", "状态: " + (jsonResponse.status || "未知"));

                if (jsonResponse.message) {
                    addLog("响应字段", "消息: " + jsonResponse.message);
                }

                if (jsonResponse.outputs) {
                    addLog("响应字段", "输出数组长度: " + jsonResponse.outputs.length);
                    if (jsonResponse.outputs.length > 0 && jsonResponse.outputs[0].object_url) {
                        addLog("响应字段", "图像URL: " + jsonResponse.outputs[0].object_url);
                    }
                }

                if (jsonResponse.object_url) {
                    addLog("响应字段", "直接图像URL: " + jsonResponse.object_url);
                }

                // 记录所有可用字段
                var allFields = [];
                for (var key in jsonResponse) {
                    if (jsonResponse.hasOwnProperty(key)) {
                        allFields.push(key);
                    }
                }
                addLog("响应字段", "所有字段: " + allFields.join(", "));

                // 检查响应状态
                if (jsonResponse && jsonResponse.status === "Success") {
                    addLog("API", apiMode + " API调用成功，状态: " + jsonResponse.status);
                    // API调用成功，返回完整响应供后续处理
                    return response;
                } else if (jsonResponse && jsonResponse.status) {
                    // API返回了状态但不是Success
                    addLog("错误", apiMode + " API调用失败，状态: " + jsonResponse.status);

                    // 直接显示API返回的错误信息
                    var errorMsg = "⚠️ BizyAir API调用失败\n\n";
                    errorMsg += "状态: " + jsonResponse.status + "\n";
                    if (jsonResponse.message) {
                        errorMsg += "消息: " + jsonResponse.message + "\n";
                    }
                    if (jsonResponse.outputs && jsonResponse.outputs.length > 0 && jsonResponse.outputs[0].error_msg) {
                        errorMsg += "详细错误: " + jsonResponse.outputs[0].error_msg + "\n";
                    }
                    errorMsg += "\n完整响应: " + response.substring(0, 200) + "...";
                    alert(errorMsg);
                    addLog("错误", "API调用失败: " + (jsonResponse.message || jsonResponse.status));
                    return null;
                } else {
                    addLog("警告", apiMode + " API响应格式异常，但尝试继续处理");
                    // 响应格式不符合预期，但可能仍然有效
                    return response;
                }
            } catch (e) {
                addLog("错误", apiMode + " API响应JSON解析失败: " + e.toString());
                // JSON解析失败，但响应可能仍然有效
                if (response && response.length > 10) {
                    return response;
                } else {
                    alert("API响应解析失败: " + e.toString());
                    return null;
                }
            }

        } catch (e) {
            alert("API调用出错: " + e.toString());
            return null;
        }
    }
    
    // 创建主对话框（中文界面）
    var mainDialog = new Window("dialog", "ZealmanAIforPS1.5 基础免费版");
    mainDialog.orientation = "column";
    mainDialog.alignChildren = "fill";
    mainDialog.spacing = 10;
    mainDialog.margins = 16;
    mainDialog.preferredSize.width = 400;
        
    // 顶部设置按钮组
    var headerGroup = mainDialog.add("group");
    headerGroup.alignment = "center";
    headerGroup.spacing = 10;

    var settingsButton = headerGroup.add("button", undefined, "API设置");
    var translateButton = headerGroup.add("button", undefined, "翻译设置");
    var proButton = headerGroup.add("button", undefined, "专业版");
    
    // AI模式选择
    var modeGroup = mainDialog.add("group");
    modeGroup.orientation = "column";
    modeGroup.alignChildren = "fill";

    var modeLabel = modeGroup.add("statictext", undefined, "AI模式选择:");
    var modeRadioGroup = modeGroup.add("group");
    modeRadioGroup.orientation = "row";
    modeRadioGroup.alignChildren = "left";
    modeRadioGroup.spacing = 30; // 增加间距

    var nanobananaRadio = modeRadioGroup.add("radiobutton", undefined, "NanoBanana");
    var seedream4Radio = modeRadioGroup.add("radiobutton", undefined, "Seedream4");

    // 加载上次保存的API模式设置
    var apiModeSettings = loadApiModeSettings();
    if (apiModeSettings.selectedMode === "seedream4") {
        seedream4Radio.value = true;
        nanobananaRadio.value = false;
        addLog("设置", "已加载上次选择的API模式: Seedream4");
    } else {
        nanobananaRadio.value = true;
        seedream4Radio.value = false;
        addLog("设置", "已加载上次选择的API模式: NanoBanana");
    }

    // 添加API模式选择事件处理
    nanobananaRadio.onClick = function() {
        if (nanobananaRadio.value) {
            var newSettings = { selectedMode: "nanobanana" };
            saveApiModeSettings(newSettings);
            addLog("设置", "已保存API模式选择: NanoBanana");
        }
    };

    seedream4Radio.onClick = function() {
        if (seedream4Radio.value) {
            var newSettings = { selectedMode: "seedream4" };
            saveApiModeSettings(newSettings);
            addLog("设置", "已保存API模式选择: Seedream4");
        }
    };

    // 提示词输入区域
    var promptGroup = mainDialog.add("group");
    promptGroup.orientation = "column";
    promptGroup.alignChildren = "fill";

    var promptLabel = promptGroup.add("statictext", undefined, "提示词:");
    var promptText = promptGroup.add("edittext", undefined, "", {multiline: true});
    promptText.preferredSize.height = 100;

    // 载入上次保存的提示词，如果没有则使用默认文本
    if (promptSettings.lastPrompt && promptSettings.lastPrompt.length > 0) {
        promptText.text = promptSettings.lastPrompt;
        addLog("设置", "已载入上次保存的提示词: " + promptSettings.lastPrompt.substring(0, 30) + "...");
    } else {
        promptText.text = "在这里输入您的提示词";
        addLog("设置", "首次使用，显示默认提示词");
    }
    
    

    

    
    // 按钮
    var buttonGroup = mainDialog.add("group");
    buttonGroup.alignment = "center";
    var generateButton = buttonGroup.add("button", undefined, "生成");
    var cancelButton = buttonGroup.add("button", undefined, "取消");

    // 右下角日志链接
    var logLinkGroup = mainDialog.add("group");
    logLinkGroup.alignment = "right";
    logLinkGroup.spacing = 5;

    var logLink = logLinkGroup.add("statictext", undefined, "日志");
    logLink.graphics.font = ScriptUI.newFont(logLink.graphics.font.name, ScriptUI.FontStyle.REGULAR, 12);
    logLink.graphics.foregroundColor = logLink.graphics.newPen(logLink.graphics.PenType.SOLID_COLOR, [0.2, 0.4, 0.8, 1], 1); // 蓝色文字

    // 添加下划线效果（模拟链接样式）
    logLink.onDraw = function() {
        var g = this.graphics;
        var bounds = [0, 0, this.size.width, this.size.height];

        // 绘制文字
        g.drawString(this.text, g.newPen(g.PenType.SOLID_COLOR, [0.2, 0.4, 0.8, 1], 1), bounds[0], bounds[1]);

        // 绘制下划线
        g.newPath();
        g.moveTo(bounds[0], bounds[3] - 2);
        g.lineTo(bounds[2], bounds[3] - 2);
        g.strokePath(g.newPen(g.PenType.SOLID_COLOR, [0.2, 0.4, 0.8, 1], 1));
    };
    
    // 事件处理器
    
    settingsButton.onClick = function() {
        showSettingsDialog();
    };
    
    translateButton.onClick = function() {
        showTranslateSettingsDialog();
    };

    proButton.onClick = function() {
        showProVersionDialog();
    };

    // 日志链接点击事件 - 直接打开日志文件
    logLink.onClick = function() {
        openLogFile();
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

        // 获取选择的API模式
        var selectedMode = nanobananaRadio.value ? "nanobanana" : "seedream4";
        addLog("用户操作", "选择API模式: " + selectedMode);

        // 检查翻译设置（仅对NanoBanana模式）
        if (selectedMode === "nanobanana" && translateSettings.enableTranslate && (!translateSettings.appId || !translateSettings.apiKey)) {
            addLog("错误", "NanoBanana模式下翻译设置不完整");
            alert("请先在翻译设置中配置百度翻译的APP ID和API密钥。");
            return;
        }

        // 保存当前提示词到配置文件
        var currentPrompt = promptText.text;
        if (currentPrompt && currentPrompt !== "这里填写描述" && currentPrompt !== "在这里输入您的提示词") {
            promptSettings.lastPrompt = currentPrompt;
            savePromptSettings(promptSettings);
            addLog("设置", "已保存提示词到配置文件: " + currentPrompt.substring(0, 30) + "...");
        }

        addLog("用户操作", "开始生成图像，提示词: " + promptText.text.substring(0, 50) + "...");
        mainDialog.close(1);
        processGeneration(selectedMode);
    };
    
    cancelButton.onClick = function() {
        mainDialog.close(0);
    };
    
    // 设置对话框（中文界面）
    function showSettingsDialog() {
        var setDialog = new Window("dialog", "API 密钥设置");
        setDialog.orientation = "column";
        setDialog.alignChildren = "fill";
        setDialog.spacing = 10;
        setDialog.margins = 16;
        setDialog.preferredSize.width = 400;
        
        // 标题
        var titleGroup = setDialog.add("group");
        titleGroup.add("statictext", undefined, "API 密钥设置");
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
        keyInput.preferredSize.width = 250;
        

        var costPanel = setDialog.add("panel", undefined, "交流群");
        costPanel.orientation = "column";
        costPanel.alignChildren = "left";
        costPanel.spacing = 3;

        costPanel.add("statictext", undefined, "• 插件更新Q群1059612745");
        
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
        var translateDialog = new Window("dialog", "翻译API设置");
        translateDialog.orientation = "column";
        translateDialog.alignChildren = "fill";
        translateDialog.spacing = 10;
        translateDialog.margins = 16;
        translateDialog.preferredSize.width = 400;
        
        // 标题
        var titleGroup = translateDialog.add("group");
        titleGroup.add("statictext", undefined, "翻译API设置");
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
        appIdInput.preferredSize.width = 250;

        // API密钥输入
        var apiKeyGroup = translateDialog.add("group");
        apiKeyGroup.add("statictext", undefined, "apiKey:");
        var apiKeyInput = apiKeyGroup.add("edittext", undefined, translateSettings.apiKey ? "****" + translateSettings.apiKey.substr(-4) : "");
        apiKeyInput.preferredSize.width = 250;
        
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
    


    // 专业版介绍对话框
    function showProVersionDialog() {
        var proDialog = new Window("dialog", "ZealmanAIforPS-2.0pro介绍");
        proDialog.orientation = "column";
        proDialog.alignChildren = "fill";
        proDialog.spacing = 15;
        proDialog.margins = 20;
        proDialog.preferredSize.width = 400;

        // 标题
        var titleGroup = proDialog.add("group");
        titleGroup.alignment = "center";
        var titleText = titleGroup.add("statictext", undefined, "🚀 ZealmanAIforPS-2.0pro");
        titleText.graphics.font = ScriptUI.newFont(titleText.graphics.font.name, ScriptUI.FontStyle.BOLD, 16);
        titleText.preferredSize.width = 350;

        // 专业版特性
        var featuresPanel = proDialog.add("panel", undefined, "专业版特性");
        featuresPanel.orientation = "column";
        featuresPanel.alignChildren = "left";
        featuresPanel.spacing = 8;
        featuresPanel.margins = 15;

        var features = [
            "✅ 自动翻译中-英文提示词",
            "✅ 运行时不再弹出黑色窗口",
            "✅ 可以常驻在PS界面",
            "✅ 无需云端部署",
            "✅ 无需comfyui配置"
        ];

        for (var i = 0; i < features.length; i++) {
            var featureText = featuresPanel.add("statictext", undefined, features[i]);
            featureText.preferredSize.width = 350;
        }

        // 联系信息
        var contactPanel = proDialog.add("panel", undefined, "获取专业版");
        contactPanel.orientation = "column";
        contactPanel.alignChildren = "left";
        contactPanel.spacing = 8;
        contactPanel.margins = 15;

        var contactText1 = contactPanel.add("statictext", undefined, "联系QQ：82768649");
        contactText1.graphics.font = ScriptUI.newFont(contactText1.graphics.font.name, ScriptUI.FontStyle.BOLD, 12);
        contactText1.preferredSize.width = 350;



        // 按钮
        var btnGroup = proDialog.add("group");
        btnGroup.alignment = "center";
        btnGroup.spacing = 10;

        var openDocBtn = btnGroup.add("button", undefined, "打开介绍文档");
        var closeBtn = btnGroup.add("button", undefined, "关闭");

        // 事件处理
        openDocBtn.onClick = function() {
            // 直接打开链接
            try {
                var linkUrl = "https://yvqd1vkznej.feishu.cn/wiki/EH0cwbr3kidnRhksOZBcs6dvncg?from=from_copylink";

                var isWindows = $.os.indexOf("Windows") !== -1;
                var isMac = $.os.indexOf("Mac") !== -1;

                if (isWindows) {
                    // Windows: 使用start命令打开链接
                    var cmd = 'cmd.exe /c start "" "' + linkUrl + '"';
                    app.system(cmd);
                    addLog("系统", "已打开专业版介绍文档: " + linkUrl);
                } else if (isMac) {
                    // macOS: 使用open命令打开链接
                    var cmd = 'open "' + linkUrl + '"';
                    app.system(cmd);
                    addLog("系统", "已打开专业版介绍文档: " + linkUrl);
                } else {
                    // Linux: 尝试使用xdg-open
                    var cmd = 'xdg-open "' + linkUrl + '"';
                    app.system(cmd);
                    addLog("系统", "已打开专业版介绍文档: " + linkUrl);
                }
            } catch (e) {
                // 如果系统命令失败，显示链接让用户手动打开
                var errorMsg = "无法自动打开链接。\n\n";
                errorMsg += "请手动访问以下链接：\n";
                errorMsg += "https://yvqd1vkznej.feishu.cn/wiki/EH0cwbr3kidnRhksOZBcs6dvncg?from=from_copylink\n\n";
                errorMsg += "错误信息: " + e.toString();
                alert(errorMsg);
                addLog("错误", "打开专业版文档失败: " + e.toString());
            }
        };

        closeBtn.onClick = function() {
            proDialog.close();
        };

        proDialog.show();
    }

    // 直接打开日志文件
    function openLogFile() {
        try {
            // 确保日志文件存在
            if (!logFile.exists) {
                // 如果文件不存在，创建一个空的日志文件
                logFile.open("w");
                logFile.writeln("# ZealmanAIforPS 日志文件");
                logFile.writeln("# 生成时间: " + new Date().toLocaleString());
                logFile.writeln("");
                logFile.close();
            }

            // 使用系统默认程序打开日志文件
            var isWindows = $.os.indexOf("Windows") !== -1;
            var isMac = $.os.indexOf("Mac") !== -1;

            if (isWindows) {
                // Windows: 使用start命令打开文件
                var cmd = 'cmd.exe /c start "" "' + logFile.fsName + '"';
                app.system(cmd);
                addLog("系统", "已使用默认程序打开日志文件: " + logFile.fsName);
            } else if (isMac) {
                // macOS: 使用open命令打开文件
                var cmd = 'open "' + logFile.fsName + '"';
                app.system(cmd);
                addLog("系统", "已使用默认程序打开日志文件: " + logFile.fsName);
            } else {
                // Linux: 尝试使用xdg-open
                var cmd = 'xdg-open "' + logFile.fsName + '"';
                app.system(cmd);
                addLog("系统", "已使用默认程序打开日志文件: " + logFile.fsName);
            }

        } catch (e) {
            // 如果系统命令失败，显示文件路径让用户手动打开
            var errorMsg = "无法自动打开日志文件。\n\n";
            errorMsg += "请手动打开以下文件：\n";
            errorMsg += logFile.fsName + "\n\n";
            errorMsg += "错误信息: " + e.toString();
            alert(errorMsg);
            addLog("错误", "打开日志文件失败: " + e.toString());
        }
    }
    

    
    // 简化的测试翻译API函数 - 使用Socket POST方法
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

    // Socket POST翻译方法
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
            
            // 解析JSON响应
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
    
    // 简化的翻译文本函数
    function translateText(text) {
        if (!translateSettings.appId || !translateSettings.apiKey) {
            return text; // 如果没有配置翻译，返回原文
        }
        
        try {
            // 使用Socket POST方法进行翻译
            return translateWithSocket(text, translateSettings.appId, translateSettings.apiKey);
        } catch (e) {
            // 翻译失败，返回原文
            return text;
        }
    }
    
    // 处理生成
    function processGeneration(apiMode) {
        try {
            // 清空之前的日志，只保留最新一次的完整生成日志
            clearLogs();
            addLog("系统", "开始新的生成任务，已清空之前的日志");
            addLog("处理", "开始处理图像生成，模式: " + apiMode);
            var doc = app.activeDocument;

            // 检查是否有选区并保存到通道
            var hasSelection = false;
            var selectionBounds = null;
            var savedSelection = null;

            try {
                selectionBounds = doc.selection.bounds;
                hasSelection = true;
                addLog("检测", "检测到选区: " + selectionBounds);

                // 保存选区到Alpha通道（关键改进）
                savedSelection = doc.channels.add();
                savedSelection.name = "zealman_temp_selection";
                doc.selection.store(savedSelection);
                addLog("处理", "选区已保存到Alpha通道: " + savedSelection.name);

            } catch(e) {
                hasSelection = false;
                addLog("检测", "未检测到选区，使用整个文档");
            }

            // 根据API模式显示不同的进度窗口标题
            var progressTitle = apiMode === "seedream4" ? "zealman Seedream4 生成中" : "zealman NanoBanana 生成中";
            var progressWin = new Window("window", progressTitle);
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
            
            // 计算目标尺寸（用于图像压缩）- 统一规则（适配两种模式）
            var targetWidth = null;
            var targetHeight = null;
            var needsCompression = false; // 默认不需要压缩

            // 获取当前文档或选区尺寸（明确使用像素单位）
            var originalWidth = doc.width.as('px');
            var originalHeight = doc.height.as('px');

            if (hasSelection) {
                originalWidth = selectionBounds[2].as('px') - selectionBounds[0].as('px');
                originalHeight = selectionBounds[3].as('px') - selectionBounds[1].as('px');
            }

            // 使用统一尺寸规则在发送API前进行尺寸校正（两种模式一致）
            var unified = calculateUnifiedSize(originalWidth, originalHeight);
            targetWidth = unified.width;
            targetHeight = unified.height;
            needsCompression = unified.needsAdjustment;

            addLog("尺寸", "原始尺寸: " + originalWidth + "x" + originalHeight);
            if (needsCompression) {
                addLog("尺寸", "统一规则缩放到: " + targetWidth + "x" + targetHeight);
            } else {
                addLog("尺寸", "尺寸符合统一规则，无需缩放");
            }

            // 导出图片和蒙版
            statusText.text = "导出图片中...";
            progressWin.update();

            var imageFile = exportImage(doc, hasSelection ? selectionBounds : null, apiMode, targetWidth, targetHeight, needsCompression);
            
            
            if (!imageFile || !imageFile.exists) {
                progressWin.close();
                alert("导出图片失败。");
                return;
            }
            
            // 准备最终提示词
            var finalPrompt = promptText.text;

            // 如果启用了翻译功能且为NanoBanana模式，先翻译提示词
            if (apiMode === "nanobanana" && translateSettings.enableTranslate && translateSettings.appId && translateSettings.apiKey) {
                addLog("翻译", "开始翻译提示词: " + finalPrompt.substring(0, 30) + "...");
                statusText.text = "翻译提示词中...";
                detailText.text = "正在将中文翻译为英文";
                progressWin.update();

                var translatedPrompt = translateText(finalPrompt);
                if (translatedPrompt !== finalPrompt) {
                    addLog("翻译", "翻译完成: " + translatedPrompt.substring(0, 50) + "...");
                    finalPrompt = translatedPrompt;
                    // 在进度窗口中显示翻译结果，而不是弹窗
                    statusText.text = "翻译完成";
                    detailText.text = "已翻译为英文: " + translatedPrompt;
                    progressWin.update();
                    // 等待2秒让用户看到翻译结果
                    $.sleep(2000);
                } else {
                    addLog("翻译", "翻译未改变原文或翻译失败");
                }
            } else if (apiMode === "seedream4") {
                addLog("处理", "Seedream4模式跳过翻译环节");
            }
            
            // 所有API模式都使用原始提示词，不添加额外前缀
            if (apiMode === "nanobanana") {
                addLog("处理", "NanoBanana模式：使用原始提示词，不添加前缀");
            } else if (apiMode === "seedream4") {
                addLog("处理", "Seedream4模式：使用原始提示词，不添加前缀");
            }
            
            // 记录最终提示词用于调试
            addLog("最终提示词", "模式: " + apiMode + ", 内容: " + finalPrompt.substring(0, 200) + (finalPrompt.length > 200 ? "..." : ""));

            // 调用BizyAir API
            statusText.text = "调用API，弹出cmd窗口不用管会自己关闭";
            detailText.text = "正在处理，预计10-20秒";
            progressWin.update();
            
            var responseText = callBizyAirAPI(
                finalPrompt,
                imageFile,
                progressWin,
                statusText,
                detailText,
                apiMode
            );
            
            if (!responseText) {
                progressWin.close();
                return;
            }
            
            progressWin.close();
            
            // 智能响应处理：优先寻找图像，忽略无价值文本
            if (responseText) {
                addLog("处理", "开始下载生成的图像");
                var resultFile = downloadBizyAirResult(responseText);

                if (resultFile && resultFile.exists) {
                    addLog("成功", "图像生成成功，文件大小: " + Math.round(resultFile.length / 1024) + " KB");
                    // 放置到当前文档
                    addLog("处理", "将图像放置到当前文档");
                    placeResultInDocument(doc, resultFile, selectionBounds, savedSelection);
                    resultFile.remove();
                } else {
                    // 直接显示API响应调试对话框，不做预设判断
                    {
                        // 显示API实际响应内容进行调试
                        var debugDialog = new Window("dialog", "API响应调试");
                    debugDialog.orientation = "column";
                    debugDialog.alignChildren = "fill";
                    debugDialog.spacing = 10;
                    debugDialog.margins = 16;
                    debugDialog.preferredSize.width = 400;
                    debugDialog.preferredSize.height = 400;
                    
                    debugDialog.add("statictext", undefined, "BizyAir API响应内容：");
                    
                    // 显示完整的API响应
                    var responsePanel = debugDialog.add("panel", undefined, "原始响应");
                    responsePanel.orientation = "column";
                    responsePanel.alignChildren = "fill";
                    
                    var responseText_display = responsePanel.add("edittext", undefined, responseText, {multiline: true, readonly: true});
                    responseText_display.preferredSize.height = 250;
                    responseText_display.preferredSize.width = 350;
                    
                    // 解析响应进行分析
                    var analysisPanel = debugDialog.add("panel", undefined, "响应分析");
                    analysisPanel.orientation = "column";
                    analysisPanel.alignChildren = "left";
                    
                    try {
                        var jsonResponse = eval('(' + responseText + ')');
                        analysisPanel.add("statictext", undefined, "• JSON解析: 成功");
                        analysisPanel.add("statictext", undefined, "• 状态: " + (jsonResponse.status || "未知"));

                        // 显示错误详情
                        if (jsonResponse.status === "Failed") {
                            analysisPanel.add("statictext", undefined, "⚠️ API调用失败");
                            if (jsonResponse.message) {
                                analysisPanel.add("statictext", undefined, "错误消息: " + jsonResponse.message);
                            }
                            if (jsonResponse.outputs && jsonResponse.outputs.length > 0 && jsonResponse.outputs[0].error_msg) {
                                analysisPanel.add("statictext", undefined, "详细错误: " + jsonResponse.outputs[0].error_msg);
                            }
                        }

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
                        
                        var retryResponse = callBizyAirAPI(finalPrompt, imageFile, null, null, null, apiMode);
                        retryProgress.close();
                        
                        if (retryResponse) {
                            var retryFile = downloadBizyAirResult(retryResponse);
                            if (retryFile && retryFile.exists) {
                                placeResultInDocument(doc, retryFile, selectionBounds);
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
                }
            } else {
                addLog("错误", "API调用失败，未收到响应");
                alert("API调用失败，未收到响应");
            }

            // 清理临时文件
            if (imageFile && imageFile.exists) {
                imageFile.remove();
                addLog("处理", "临时文件已清理");
            }

            // 清理保存的选区通道（如果还存在）
            if (savedSelection) {
                try {
                    savedSelection.remove();
                    addLog("处理", "临时选区通道已清理");
                } catch (e) {
                    addLog("警告", "清理选区通道失败: " + e.toString());
                }
            }

        } catch(err) {
            addLog("错误", "生成过程出错: " + err.toString() + (err.line ? " 行号: " + err.line : ""));

            // 确保在错误情况下也清理选区通道
            if (savedSelection) {
                try {
                    savedSelection.remove();
                    addLog("处理", "错误处理中清理了选区通道");
                } catch (e) {}
            }

            alert("错误: " + err.toString() + "\n行号: " + err.line);
        }
    }
    
    // 计算Seedream4所需的压缩尺寸
    function calculateSeedream4Size(originalWidth, originalHeight) {
        var minDimension = Math.min(originalWidth, originalHeight);
        var maxDimension = Math.max(originalWidth, originalHeight);

        var adjustedWidth = originalWidth;
        var adjustedHeight = originalHeight;
        var needsAdjustment = false;

        // 检查是否需要调整尺寸
        if (minDimension < 1024 || maxDimension > 4096) {
            needsAdjustment = true;

            // 计算调整策略
            if (minDimension < 1024) {
                // 最短边过小：按比例放大到最短边1024
                var scaleFactor = 1024 / minDimension;
                adjustedWidth = Math.round(originalWidth * scaleFactor);
                adjustedHeight = Math.round(originalHeight * scaleFactor);
            }

            if (Math.max(adjustedWidth, adjustedHeight) > 4096) {
                // 最长边过大：按比例缩小到最长边4096
                var maxAdjusted = Math.max(adjustedWidth, adjustedHeight);
                var scaleFactor = 4096 / maxAdjusted;
                adjustedWidth = Math.round(adjustedWidth * scaleFactor);
                adjustedHeight = Math.round(adjustedHeight * scaleFactor);
            }
        }

        return {
            width: adjustedWidth,
            height: adjustedHeight,
            needsAdjustment: needsAdjustment
        };
    }

    // 统一尺寸计算（兼容JSX环境，不依赖UXP API）
    // 规则参考UXP文档：
    // - Seedream4：短边>=1024，长边<=4096，否则按比例缩放到范围内
    // - NanoBanana：若最长边>2048则等比缩小到2048；其余尺寸保持
    // 统一实现：
    // 1) 先应用Seedream4区间约束（短边<1024放大；长边>4096缩小）
    // 2) 对于nanobanana模式，最终发送前若长边>2048再二次裁剪为<=2048
    // 为便于统一调用，这里不区分模式，返回满足Seedream4范围的尺寸；
    // 在exportImage里根据apiMode做附加2048限制（保持原有JSX逻辑兼容）。
    function calculateUnifiedSize(originalWidth, originalHeight) {
        var minSize = 1024;
        var maxSize = 4096;
        var adjustedWidth = originalWidth;
        var adjustedHeight = originalHeight;
        var needsAdjustment = false;

        var minDimension = Math.min(originalWidth, originalHeight);
        var maxDimension = Math.max(originalWidth, originalHeight);

        if (minDimension < minSize) {
            var scaleUp = minSize / minDimension;
            adjustedWidth = Math.round(originalWidth * scaleUp);
            adjustedHeight = Math.round(originalHeight * scaleUp);
            needsAdjustment = true;
        }

        var afterMax = Math.max(adjustedWidth, adjustedHeight);
        if (afterMax > maxSize) {
            var scaleDown = maxSize / afterMax;
            adjustedWidth = Math.round(adjustedWidth * scaleDown);
            adjustedHeight = Math.round(adjustedHeight * scaleDown);
            needsAdjustment = true;
        }

        return {
            width: adjustedWidth,
            height: adjustedHeight,
            needsAdjustment: needsAdjustment
        };
    }

    // 智能图片导出函数 - 支持API模式优化和尺寸压缩
    function exportImage(doc, bounds, apiMode, targetWidth, targetHeight, needsCompression) {
        try {
            var timestamp = new Date().getTime();
            var tempFile = new File(Folder.temp + "/flux_input_" + timestamp + ".jpg");

            if (bounds) {
                // 有选区：先导出选区，再根据API模式压缩
                addLog("导出", "开始导出选区图像");

                // 复制选区到新图层
                doc.selection.deselect();
                doc.artLayers.add();
                var tempLayer = doc.activeLayer;
                tempLayer.name = "Temp Merged";

                selectAll();
                copyMerged();
                doc.paste();

                var cropDoc = doc.duplicate("temp_crop", true);
                cropDoc.crop([bounds[0], bounds[1], bounds[2], bounds[3]]);

                // 按统一尺寸进行缩放（先统一规则，再针对nanobanana做2048上限保护）
                if (targetWidth && targetHeight && needsCompression) {
                    addLog("压缩", "统一规则：缩放图像到 " + targetWidth + "x" + targetHeight);
                    cropDoc.resizeImage(
                        UnitValue(targetWidth, "px"),
                        UnitValue(targetHeight, "px"),
                        null,
                        ResampleMethod.BICUBIC
                    );
                } else {
                    addLog("跳过", "统一规则：尺寸符合要求，跳过缩放");
                }

                // 已移除NanoBanana 2048限制，统一按1024-4096规则处理

                var saveOptions = new JPEGSaveOptions();
                saveOptions.quality = 10;
                cropDoc.saveAs(tempFile, saveOptions, true, Extension.LOWERCASE);

                cropDoc.close(SaveOptions.DONOTSAVECHANGES);

                doc.activeLayer = tempLayer;
                tempLayer.remove();

                addLog("导出", "选区图像导出完成，已应用API优化");

            } else {
                // 无选区：导出整个文档并压缩
                addLog("导出", "开始导出整个文档");

                var tempDoc = doc.duplicate();
                tempDoc.flatten();

                // 按统一尺寸进行缩放（先统一规则，再通用/模式化保护）
                if (targetWidth && targetHeight && needsCompression) {
                    addLog("压缩", "统一规则：缩放文档到 " + targetWidth + "x" + targetHeight);
                    tempDoc.resizeImage(
                        UnitValue(targetWidth, "px"),
                        UnitValue(targetHeight, "px"),
                        null,
                        ResampleMethod.BICUBIC
                    );
                } else {
                    addLog("跳过", "统一规则：尺寸符合要求，跳过缩放");
                }

                // 已移除NanoBanana 2048限制，统一按1024-4096规则处理

                var saveOptions = new JPEGSaveOptions();
                saveOptions.quality = 10;
                tempDoc.saveAs(tempFile, saveOptions, true, Extension.LOWERCASE);
                tempDoc.close(SaveOptions.DONOTSAVECHANGES);

                addLog("导出", "文档图像导出完成，已应用API优化");
            }

            // 记录最终文件信息
            if (tempFile.exists) {
                var fileSizeKB = Math.round(tempFile.length / 1024);
                addLog("导出", "图像文件大小: " + fileSizeKB + " KB");
            }

            return tempFile;

        } catch (e) {
            addLog("错误", "导出图片失败: " + e.toString());
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
            addLog("下载", "开始解析API响应以获取图像URL");

            // 解析BizyAir API响应
            var json = null;
            try {
                json = eval('(' + response + ')');
                addLog("下载", "响应JSON解析成功");
            } catch (e) {
                json = null;
                addLog("错误", "响应JSON解析失败: " + e.toString());
            }

            var imageUrl = null;

            // 1) BizyAir API响应格式解析 - 根据实际API响应格式
            if (json && json.status === "Success") {
                addLog("下载", "API状态为Success，开始查找图像URL");

                // BizyAir API返回outputs数组，每个元素包含object_url
                if (json.outputs && json.outputs.length > 0 && json.outputs[0].object_url) {
                    imageUrl = json.outputs[0].object_url;
                    addLog("下载", "从outputs[0].object_url获取图像URL: " + imageUrl.substring(0, 100) + "...");
                }
                // 兼容旧格式：直接在根级别的object_url
                else if (json.object_url && typeof json.object_url === "string") {
                    imageUrl = json.object_url;
                    addLog("下载", "从根级object_url获取图像URL: " + imageUrl.substring(0, 100) + "...");
                }
                // 兼容其他可能的字段
                else if (json.output && typeof json.output === "string") {
                    if (json.output.indexOf("data:image/") !== -1) {
                        imageUrl = json.output;
                        addLog("下载", "从json.output获取data:image格式URL");
                    } else if (json.output.indexOf("http") !== -1) {
                        imageUrl = json.output;
                        addLog("下载", "从json.output获取HTTP格式URL: " + imageUrl.substring(0, 100) + "...");
                    }
                } else if (json.result && json.result.output_images) {
                    var outputImages = json.result.output_images;
                    if (outputImages.length > 0) {
                        imageUrl = outputImages[0];
                        addLog("下载", "从result.output_images获取图像URL: " + imageUrl.substring(0, 100) + "...");
                    }
                } else {
                    addLog("警告", "未在标准字段中找到图像URL，尝试其他方法");
                }
            } else {
                addLog("错误", "API状态不是Success或JSON为空，状态: " + (json ? json.status : "JSON为空"));
            }

            // 2) 处理任务状态响应
            if (json && json.task_id && !imageUrl) {
                // 如果返回任务ID，说明任务正在处理中
                addLog("任务", "收到任务ID: " + json.task_id + "，任务可能仍在处理中");
                alert("任务已提交，任务ID: " + json.task_id + "\n请稍后查看结果。");
                return null;
            }

            // 2) 在原始文本中搜索
            if (!imageUrl && typeof response === "string") {
                addLog("下载", "JSON解析未找到图像URL，开始文本搜索");

                // 首先搜索outputs数组中的object_url字段
                var outputsUrlMatch = response.match(/"outputs"\s*:\s*\[\s*\{[^}]*"object_url"\s*:\s*"([^"]+)"/);
                if (outputsUrlMatch && outputsUrlMatch[1]) {
                    imageUrl = outputsUrlMatch[1];
                    addLog("下载", "通过正则表达式在outputs数组中找到URL: " + imageUrl.substring(0, 100) + "...");
                } else {
                    // 搜索简单的object_url字段
                    var objectUrlMatch = response.match(/"object_url"\s*:\s*"([^"]+)"/);
                    if (objectUrlMatch && objectUrlMatch[1]) {
                        imageUrl = objectUrlMatch[1];
                        addLog("下载", "通过正则表达式找到object_url: " + imageUrl.substring(0, 100) + "...");
                    } else {
                        // 搜索data URI
                        var dataUriRe2 = new RegExp("(data:image\\/[A-Za-z0-9+]+;base64,[A-Za-z0-9+\\/=]+)");
                        var m3 = dataUriRe2.exec(response);
                        if (m3 && m3[1]) {
                            imageUrl = m3[1];
                            addLog("下载", "找到data URI格式图像");
                        } else {
                            // 搜索HTTP URL
                            var urlRe2 = new RegExp("https?:\\/\\/[^\"']+\\.(?:jpg|jpeg|png|webp)(?:\\?[^\"'\\s]*)?", "i");
                            var m4 = urlRe2.exec(response);
                            if (m4 && m4[0]) {
                                imageUrl = m4[0];
                                addLog("下载", "通过正则表达式找到HTTP图像URL: " + imageUrl.substring(0, 100) + "...");
                            } else {
                                addLog("警告", "所有文本搜索方法都未找到图像URL");
                            }
                        }
                    }
                }
            }

            // 如果没有找到图像，显示调试信息
            if (!imageUrl) {
                addLog("错误", "未能从API响应中提取图像URL");

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
                    addLog("调试", "响应字段详情: " + fields.join(", "));

                    // 显示关键字段内容
                    if (json.outputs && json.outputs.length > 0 && json.outputs[0].object_url) {
                        debugMsg += "Object URL (outputs[0]): " + json.outputs[0].object_url.substring(0, 100) + "...\n\n";
                        addLog("调试", "发现outputs[0].object_url: " + json.outputs[0].object_url.substring(0, 100) + "...");
                    } else if (json.object_url) {
                        debugMsg += "Object URL: " + json.object_url.substring(0, 100) + "...\n\n";
                        addLog("调试", "发现object_url: " + json.object_url.substring(0, 100) + "...");
                    }
                    if (json.output) {
                        debugMsg += "Output字段内容: " + json.output.substring(0, 100) + "...\n\n";
                        addLog("调试", "发现output字段: " + json.output.substring(0, 100) + "...");
                    }
                } else {
                    debugMsg += "JSON解析失败\n";
                    debugMsg += "原始响应: " + response.substring(0, 200) + "...\n\n";
                    addLog("错误", "JSON解析失败，原始响应: " + response.substring(0, 200) + "...");
                }
                // 静默返回null，让主逻辑处理调试显示
                return null;
            }

            // 3) 下载/转换结果到临时文件
            addLog("下载", "开始下载图像，URL类型: " + (imageUrl.indexOf("data:image/") === 0 ? "data URI" : "HTTP URL"));

            var timestamp = new Date().getTime();

            // 根据API响应确定文件扩展名
            var fileExtension = ".jpg"; // 默认扩展名
            try {
                if (json && json.outputs && json.outputs.length > 0 && json.outputs[0].output_ext) {
                    fileExtension = json.outputs[0].output_ext;
                    addLog("下载", "使用API返回的文件扩展名: " + fileExtension);
                } else {
                    addLog("下载", "未找到API扩展名信息，使用默认扩展名: " + fileExtension);
                }
            } catch (e) {
                addLog("下载", "解析扩展名时出错，使用默认扩展名: " + fileExtension);
            }

            var resultFile = new File(Folder.temp + "/openrouter_result_" + timestamp + fileExtension);
            addLog("下载", "临时文件路径: " + resultFile.fsName);

            if (imageUrl.indexOf("data:image/") === 0) {
                // data URI转换
                addLog("下载", "处理data URI格式图像");
                var b64file = new File(Folder.temp + "/tmp_b64_" + timestamp + ".txt");
                b64file.open("w");
                b64file.write(imageUrl.replace(/^data:image\/[A-Za-z0-9+]+;base64,/, ""));
                b64file.close();
                addLog("下载", "Base64数据已写入临时文件: " + b64file.fsName);

                if ($.os.indexOf("Windows") !== -1) {
                    var decCmd = 'cmd.exe /c certutil -decode "' + b64file.fsName + '" "' + resultFile.fsName + '"';
                    addLog("下载", "Windows系统，使用certutil解码: " + decCmd);
                    app.system(decCmd);
                } else {
                    var decCmd = '/bin/sh -c \'base64 -d "' + b64file.fsName + '" > "' + resultFile.fsName + '"\'';
                    addLog("下载", "Unix系统，使用base64解码: " + decCmd);
                    app.system(decCmd);
                }
                b64file.remove();
                addLog("下载", "临时Base64文件已清理");
            } else {
                // 直接URL下载
                addLog("下载", "下载HTTP URL图像: " + imageUrl.substring(0, 100) + "...");
                var curlCmd = 'curl -s -L "' + imageUrl + '" > "' + resultFile.fsName + '"';
                var isWindows = $.os.indexOf("Windows") !== -1;
                if (isWindows) {
                    addLog("下载", "Windows系统，使用curl下载: " + curlCmd);
                    app.system('cmd.exe /c ' + curlCmd);
                } else {
                    addLog("下载", "Unix系统，使用curl下载: " + curlCmd);
                    app.system('/bin/sh -c \'' + curlCmd + '\'');
                }
            }

            if (resultFile.exists && resultFile.length > 0) {
                addLog("下载", "图像下载成功，文件大小: " + Math.round(resultFile.length / 1024) + " KB");
                return resultFile;
            } else {
                addLog("错误", "图像下载失败，文件不存在或大小为0");
            }
            return null;

        } catch (e) {
            return null;
        }
    }
    
    // 功图片放置方法 - 改进版本，使用保存的选区通道
    function placeResultInDocument(doc, resultFile, selectionBounds, savedSelection) {
        try {
            addLog("处理", "开始放置生成的图像到文档");

            var resultDoc = app.open(resultFile);
            resultDoc.artLayers[0].duplicate(doc, ElementPlacement.PLACEATBEGINNING);
            resultDoc.close(SaveOptions.DONOTSAVECHANGES);

            var newLayer = doc.artLayers[0];
            newLayer.name = "zealman-generated";
            addLog("处理", "新图层已创建: " + newLayer.name);

            if (selectionBounds) {
                var x1 = Math.round(selectionBounds[0].value);
                var y1 = Math.round(selectionBounds[1].value);
                var x2 = Math.round(selectionBounds[2].value);
                var y2 = Math.round(selectionBounds[3].value);

                var targetWidth = x2 - x1;
                var targetHeight = y2 - y1;
                addLog("处理", "目标尺寸: " + targetWidth + "x" + targetHeight);

                var currentBounds = newLayer.bounds;
                var currentWidth = currentBounds[2].value - currentBounds[0].value;
                var currentHeight = currentBounds[3].value - currentBounds[1].value;

                // 精确拉伸图层尺寸以匹配选区
                if (Math.abs(currentWidth - targetWidth) > 1 || Math.abs(currentHeight - targetHeight) > 1) {
                    var scaleX = (targetWidth / currentWidth) * 100;
                    var scaleY = (targetHeight / currentHeight) * 100;

                    addLog("校正", "当前图层尺寸: " + currentWidth + " x " + currentHeight);
                    addLog("校正", "目标选区尺寸: " + targetWidth + " x " + targetHeight);
                    addLog("校正", "拉伸比例: X=" + scaleX.toFixed(2) + "%, Y=" + scaleY.toFixed(2) + "%");

                    // 使用精确拉伸而不是保持宽高比
                    newLayer.resize(scaleX, scaleY, AnchorPosition.TOPLEFT);
                    addLog("校正", "图层已精确拉伸到选区尺寸");
                } else {
                    addLog("校正", "尺寸已匹配，跳过校正");
                }

                // 将图层移动到选区中心
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
                addLog("处理", "图层已移动到选区位置");

                // 使用保存的选区添加蒙版
                if (savedSelection) {
                    addLog("蒙版", "使用保存的选区通道添加蒙版");
                    try {
                        // 确保新图层是活动图层
                        doc.activeLayer = newLayer;

                        // 从保存的通道加载选区
                        doc.selection.load(savedSelection);
                        addLog("蒙版", "选区已从通道恢复");

                        // 添加图层蒙版
                        var maskSuccess = addLayerMask();

                        if (!maskSuccess) {
                            addLog("蒙版", "主要蒙版方法失败，尝试简化方法");
                            maskSuccess = addSimpleLayerMask();
                        }

                        if (maskSuccess) {
                            addLog("成功", "蒙版已成功添加到新图层");
                        } else {
                            addLog("警告", "蒙版添加失败，但图层已正确放置");
                        }

                        // 清除选区
                        doc.selection.deselect();

                        // 清理保存的选区通道
                        savedSelection.remove();
                        addLog("处理", "临时选区通道已清理");

                    } catch (maskError) {
                        addLog("错误", "蒙版处理失败: " + maskError.toString());
                        // 即使蒙版失败，也要清理通道
                        try {
                            if (savedSelection) savedSelection.remove();
                        } catch (e) {}
                    }
                } else {
                    addLog("警告", "没有保存的选区，跳过蒙版添加");
                }
            } else {
                // 无选区时，将图像精确拉伸到文档尺寸
                addLog("校正", "无选区，开始文档尺寸校正");

                var docWidth = doc.width.as('px');
                var docHeight = doc.height.as('px');

                var currentBounds = newLayer.bounds;
                var currentWidth = currentBounds[2].value - currentBounds[0].value;
                var currentHeight = currentBounds[3].value - currentBounds[1].value;

                addLog("校正", "当前图层尺寸: " + currentWidth + " x " + currentHeight);
                addLog("校正", "目标文档尺寸: " + docWidth + " x " + docHeight);

                // 检查是否需要校正（允许1像素误差）
                if (Math.abs(currentWidth - docWidth) > 1 || Math.abs(currentHeight - docHeight) > 1) {
                    var scaleX = (docWidth / currentWidth) * 100;
                    var scaleY = (docHeight / currentHeight) * 100;

                    addLog("校正", "拉伸比例: X=" + scaleX.toFixed(2) + "%, Y=" + scaleY.toFixed(2) + "%");

                    // 使用精确拉伸到文档尺寸
                    newLayer.resize(scaleX, scaleY, AnchorPosition.TOPLEFT);
                    addLog("校正", "图层已精确拉伸到文档尺寸");

                    // 将图层移动到文档中心
                    var finalBounds = newLayer.bounds;
                    var finalWidth = finalBounds[2].value - finalBounds[0].value;
                    var finalHeight = finalBounds[3].value - finalBounds[1].value;

                    var docCenterX = docWidth / 2;
                    var docCenterY = docHeight / 2;
                    var currentCenterX = finalBounds[0].value + (finalWidth / 2);
                    var currentCenterY = finalBounds[1].value + (finalHeight / 2);

                    var dx = docCenterX - currentCenterX;
                    var dy = docCenterY - currentCenterY;

                    newLayer.translate(dx, dy);
                    addLog("校正", "图层已移动到文档中心");
                } else {
                    addLog("校正", "尺寸已匹配文档，跳过校正");
                }
            }

            addLog("成功", "图像放置完成");

        } catch (e) {
            addLog("错误", "放置图片时出错: " + e.toString());
            alert("放置图片时出错: " + e.toString());
        }
    }
    
    // addLayerMask函数 - 基于当前选区添加图层蒙版
    function addLayerMask() {
        try {
            addLog("蒙版", "开始添加图层蒙版");

            // 使用ActionDescriptor添加蒙版
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

            addLog("蒙版", "图层蒙版添加成功");
            return true;
        } catch (e) {
            addLog("错误", "添加图层蒙版失败: " + e.toString());
            return false;
        }
    }

    // 简化的蒙版添加函数
    function addSimpleLayerMask() {
        try {
            addLog("蒙版", "使用简化方法添加蒙版");

            // 方法1：使用最直接的ActionDescriptor
            try {
                var desc = new ActionDescriptor();
                var ref = new ActionReference();
                ref.putEnumerated(charIDToTypeID("Chnl"), charIDToTypeID("Chnl"), charIDToTypeID("Msk "));
                desc.putReference(charIDToTypeID("null"), ref);
                desc.putEnumerated(charIDToTypeID("Usng"), charIDToTypeID("UsrM"), charIDToTypeID("RvlS"));
                executeAction(charIDToTypeID("Mk  "), desc, DialogModes.NO);

                addLog("蒙版", "简化蒙版添加成功");
                return true;
            } catch (e1) {
                addLog("蒙版", "简化方法1失败，尝试方法2");

                // 方法2：使用stringIDToTypeID
                try {
                    var desc2 = new ActionDescriptor();
                    var ref2 = new ActionReference();
                    ref2.putEnumerated(stringIDToTypeID("channel"), stringIDToTypeID("channel"), stringIDToTypeID("mask"));
                    desc2.putReference(stringIDToTypeID("null"), ref2);
                    desc2.putEnumerated(stringIDToTypeID("using"), stringIDToTypeID("userMaskEnabled"), stringIDToTypeID("revealSelection"));
                    executeAction(stringIDToTypeID("make"), desc2, DialogModes.NO);

                    addLog("蒙版", "简化蒙版方法2成功");
                    return true;
                } catch (e2) {
                    addLog("错误", "所有简化蒙版方法都失败: " + e2.toString());
                    return false;
                }
            }
        } catch (e) {
            addLog("错误", "简化蒙版方法失败: " + e.toString());
            return false;
        }
    }
    
    
    // 初始化 - 检查API密钥
    if (!apiKey) {
        showSettingsDialog();
        if (apiKey) {
            mainDialog.show();
        }
    } else {
        mainDialog.show();
    }
}