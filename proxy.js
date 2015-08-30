var Proxy = require("anyproxy");
var ipc = require('ipc');
var path = require("path");
var qs = require('querystring');

var url = require('url');
var queryString = require('querystring');

var util = require('./util.js');
var portfinder = require('portfinder'),
    rootCADLink = '';
var qrCode = require('qrcode-npm');
var localIp = util.getLocalIP();
var httpPort, proxyPort;


var config = {
    https: true,
    noCache: true
};


var nsh = require('node-syntaxhighlighter');

// var code = '.searchbox{position:relative;height:45px;z-index:10;box-shadow:0 0 4px #575757}.searchbox .searchbox-wrap{display:block;height:45px;margin-right:60px;background-color:rgba(255,255,255,.9)}.searchbox .searchbox-wrap .searchbox-inline{position:relative;display:block;height:100%}.searchbox .searchbox-wrap .searchbox-inline .searchbox-input{display:block;height:100%;margin:0 30px 0 0;overflow:hidden}.searchbox .searchbox-wrap .searchbox-inline .searchbox-input input{width:100%;height:100%;padding-left:7px;border:0;outline:0;color:#298eff;font-size:14px;-webkit-box-sizing:border-box;-webkit-appearance:none;-webkit-tap-highlight-color:rgba(255,255,255,0);background:transparent}.searchbox .searchbox-btn{position:absolute;width:60px!important;height:45px;padding:0;border:0;border-radius:0;top:0;right:0;background-image:url(http://img2.bdstatic.com/static/wiseindex/widget/search/img/searchbtn_20de227.png);background-color:transparent;background-position-x:center;background-position-y:center;background-repeat:no-repeat;background-attachment:scroll;color:#282828;font-size:14px;z-index:0;outline:0;-webkit-appearance:none}.searchbox .searchbox-clear{position:absolute;width:30px;height:100%;right:8px;top:0;background-image:url(http://img2.bdstatic.com/static/wiseindex/widget/search/img/cleanbtn_7c3d129.png);background-color:transparent;background-position-x:center;background-position-y:center;background-repeat:no-repeat;background-attachment:scroll;background-size:16px auto;-webkit-tap-highlight-color:rgba(255,255,255,0)}.ui-suggestion{margin-top:5px;border:1px solid #d9d9d9;background:#f7f7f7;-webkit-box-shadow:0 2px 5px rgba(0,0,0,.1);box-shadow:0 2px 5px rgba(0,0,0,.1)}.ui-suggestion .ui-suggestion-button{position:relative;height:35px;line-height:35px;background:#f7f7f7}.ui-suggestion .ui-suggestion-button a{display:block;color:#282828}.ui-suggestion .ui-suggestion-button .ui-suggestion-history{width:120px;height:100%;border-right:1px solid #ebebeb;text-indent:30px;background:url(http://img0.bdstatic.com/static/wiseindex/widget/index/img/indexicons_622efd3.png) no-repeat 10px -647px;background-size:20px}.ui-suggestion .ui-suggestion-button .ui-suggestion-close{position:absolute;right:0;top:0;height:100%;width:60px;text-align:center;border-left:1px solid #ebebeb}.ui-suggestion .ui-suggestion-item{border-bottom:1px solid #ebebeb;color:#666;position:relative}.ui-suggestion .ui-suggestion-item:active{background-color:#eef3fe}.ui-suggestion .ui-suggestion-item a{display:block;line-height:20px;padding:10px;-webkit-tap-highlight-color:rgba(255,255,255,0)}.ui-suggestion .ui-suggestion-item .ui-suggestion-itemtxt{color:#282828;font-weight:400;font-size:14px;margin-right:52px;-ms-word-break:break-all;word-break:break-all;overflow:hidden}.ui-suggestion .ui-suggestion-item .ui-suggestion-itemtxt em{color:#999;font-weight:400}.ui-suggestion .ui-suggestion-item .ui-suggestion-itemedit{position:absolute;width:45px;height:40px;margin-top:-20px;top:50%;right:0}.ui-suggestion .ui-suggestion-item .ui-suggestion-itemico{display:inline-block;width:25px;height:25px;margin:8px 0 0 10px;background:url(http://img0.bdstatic.com/static/wiseindex/widget/index/img/indexicons_622efd3.png) no-repeat 8px -687px;background-size:25px auto}';


// var language = nsh.getLanguage('css');
// var html = nsh.highlight(code, language);

!Proxy.isRootCAFileExists() && Proxy.generateRootCA();

var rules = {
    summary: function() {
        return "this is a blank rule for anyproxy";
    },

    shouldUseLocalResponse: function(req, reqBody) {
        return false;
    },

    dealLocalResponse: function(req, reqBody, callback) {
        callback(statusCode, resHeader, responseData);
    },

    replaceRequestProtocol: function(req, protocol) {
        return protocol;
    },

    replaceRequestOption: function(req, option) {
        var newOption = option;
        if (config.noCache) {
            delete newOption.headers['if-none-match'];
            delete newOption.headers['if-modified-since'];
        }

        return newOption;
    },

    replaceRequestData: function(req, data) {
        return data;
    },

    replaceResponseStatusCode: function(req, res, statusCode) {
        return statusCode;
    },

    replaceResponseHeader: function(req, res, header) {
        header = header || {};
        if (config.noCache) {
            header['Cache-Control'] = "no-cache, no-store, must-revalidate";
            header.Pragma = "no-cache";
            header.Expires = 0;
        }

        return header;
    },

    replaceServerResDataAsync: function(req, res, serverResData, callback) {
        callback(serverResData);
    },

    pauseBeforeSendingResponse: function(req, res) {
        return 0;
    },

    shouldInterceptHttpsReq: function(req) {
        if (config.https) {
            return true;
        }
        return false;
    }
};

var sender = null,
    isListening = true;
ipc.on('main:ready', function(event) {
    if (!sender) {
        sender = event.sender;
        sender.send('main:proxyAddress', 'http://' + localIp + ':' + proxyPort);
    } else {
        sender.send('main:proxyAddress', 'http://' + localIp + ':' + proxyPort);
        return false;
    }

    GLOBAL.recorder.on('update', function(data) {
        if (!isListening) {
            return false;
        }
        var id = data._id;
        if (data.statusCode && data.protocol) {
            GLOBAL.recorder.getBodyUTF8(id, function(err, resBody) {
                var query = url.parse(data.url).query;
                data.params = queryString.parse(query);
                data.resBody = resBody;
                data.reqBody = qs.parse(data.reqBody);
                sender.send('requestData', data);
            });
        }
    });
});

ipc.on('main:startListenReq', function(event, isListenReq) {
    isListening = isListenReq;
});

var qrSender = null;
portfinder.getPort(function(err, port) {
    httpPort = port;
    var HomePath = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
    var RootPath = path.join(HomePath, "/.anyproxy_certs/");

    var connect = require('connect');
    var serveStatic = require('serve-static');
    var con = connect();

    con.use('/', function(req, res, next) {
        if (qrSender && req.url.indexOf('rootCA.crt') > -1) {
            qrSender.send('qrcode:scan');
        }
        next();
    });
    con.use(serveStatic(RootPath)).listen(port);

    rootCADLink = 'http://' + localIp + ':' + port + '/rootCA.crt';
});


ipc.on('qrcode:ready', function(event) {
    var qr = qrCode.qrcode(4, 'M');
    qr.addData(rootCADLink);
    qr.make();
    qrSender = event.sender;
    event.sender.send('qrcode:dlink', {
        link: rootCADLink,
        imgTag: qr.createImgTag(4)
    });
});

var options = {
    type: "http",
    port: 8001,
    rule: rules,
    hostname: "localhost",
    disableWebInterface: true,
    silent: true
};

portfinder.getPort(function(err, port) {
    proxyPort = port;
    options.port = port;
    new Proxy.proxyServer(options);
});

module.exports = {};