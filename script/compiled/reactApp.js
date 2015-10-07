'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var ipc = require('ipc');
var remote = require('remote');
var Menu = remote.require('menu');
var MenuItem = remote.require('menu-item');
var clipboard = require('clipboard');

var StatusMessage = {
  "100": "Continue",
  "101": "Switching Protocols",
  "102": "Processing",
  "200": "OK",
  "201": "Created",
  "202": "Accepted",
  "203": "Non-Authoritative Information",
  "204": "No Content",
  "205": "Reset Content",
  "206": "Partial Content",
  "207": "Multi-Status",
  "208": "Already Reported",
  "226": "IM Used",
  "300": "Multiple Choices",
  "301": "Moved Permanently",
  "302": "Found",
  "303": "See Other",
  "304": "Not Modified",
  "305": "Use Proxy",
  "306": "(Unused)",
  "307": "Temporary Redirect",
  "308": "Permanent Redirect",
  "400": "Bad Request",
  "401": "Unauthorized",
  "402": "Payment Required",
  "403": "Forbidden",
  "404": "Not Found",
  "405": "Method Not Allowed",
  "406": "Not Acceptable",
  "407": "Proxy Authentication Required",
  "408": "Request Timeout",
  "409": "Conflict",
  "410": "Gone",
  "411": "Length Required",
  "412": "Precondition Failed",
  "413": "Payload Too Large",
  "414": "URI Too Long",
  "415": "Unsupported Media Type",
  "416": "Range Not Satisfiable",
  "417": "Expectation Failed",
  "418": "I'm a teapot",
  "422": "Unprocessable Entity",
  "423": "Locked",
  "424": "Failed Dependency",
  "425": "Unordered Collection",
  "426": "Upgrade Required",
  "428": "Precondition Required",
  "429": "Too Many Requests",
  "431": "Request Header Fields Too Large",
  "451": "Unavailable For Legal Reasons",
  "500": "Internal Server Error",
  "501": "Not Implemented",
  "502": "Bad Gateway",
  "503": "Service Unavailable",
  "504": "Gateway Timeout",
  "505": "HTTP Version Not Supported",
  "506": "Variant Also Negotiates",
  "507": "Insufficient Storage",
  "508": "Loop Detected",
  "509": "Bandwidth Limit Exceeded",
  "510": "Not Extended",
  "511": "Network Authentication Required"
};

var ReactMenu = React.createClass({
  displayName: 'ReactMenu',

  getInitialState: function getInitialState() {
    return {
      started: true
    };
  },
  toggleStart: function toggleStart(event) {
    var isStarted = this.state.started;
    if (!isStarted) {
      this.sendClearRequestData();
    }

    this.setState({
      started: !isStarted
    });

    ipc.send('main:startListenReq', !isStarted);
  },
  sendClearRequestData: function sendClearRequestData() {
    ipc.send('main:clearRequestData');
  },
  showQRCode: function showQRCode() {
    ipc.send('main:showQRCodeDialog');
  },
  componentDidMount: function componentDidMount() {
    var node = document.getElementById('proxyAddress');
    ipc.on('main:proxyAddress', function (proxyAddress) {
      node.innerText = proxyAddress;
    });

    var menu = new Menu();
    menu.append(new MenuItem({ label: 'Copy Proxy Address', click: function click() {
        clipboard.writeText(node.innerText);
      } }));

    node.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      menu.popup(remote.getCurrentWindow());
    }, false);
  },
  render: function render() {
    var text = 'Start';
    var className = 'fa fa-play';
    var btnClass = 'pure-button btn-w120';
    if (this.state.started) {
      text = 'Running';
      className = 'fa fa-circle-o-notch fa-spin fa-fw margin-bottom';
      btnClass = 'pure-button btn-w120 button-cat';
    }

    return React.createElement(
      'div',
      null,
      React.createElement(
        'button',
        { className: btnClass, onClick: this.toggleStart },
        React.createElement('i', { className: className }),
        text
      ),
      React.createElement(
        'button',
        { className: 'pure-button button-warning', onClick: this.sendClearRequestData },
        React.createElement('i', { className: 'fa fa-trash-o' }),
        'Clear (Cmd+X)'
      ),
      React.createElement('span', { className: 'split' }),
      React.createElement(
        'button',
        { className: 'pure-button button-success', onClick: this.showQRCode },
        React.createElement('i', { className: 'fa fa-qrcode' }),
        'Download QR rootCA'
      ),
      React.createElement(
        'ul',
        { className: 'connect-info pure-menu-list' },
        React.createElement(
          'li',
          null,
          React.createElement(
            'strong',
            null,
            'Proxy Address :'
          ),
          ' ',
          React.createElement('span', { id: 'proxyAddress' })
        ),
        React.createElement(
          'li',
          null,
          React.createElement(
            'strong',
            null,
            'Connection :'
          ),
          ' ',
          React.createElement(
            'span',
            { id: 'connectNum' },
            '0'
          )
        )
      )
    );
  }
});

var ReactApp = React.createClass({
  displayName: 'ReactApp',

  getInitialState: function getInitialState() {
    return {
      filterStr: '',
      filterType: 'All'
    };
  },
  changeFilterType: function changeFilterType(e) {
    var type = e.target.text;
    this.setState({
      filterType: type
    });
  },
  changeFilterStr: function changeFilterStr(e) {
    var str = e.target.value;
    str = str.trim();
    this.setState({
      filterStr: str
    });
  },
  render: function render() {
    var types = ['All', 'Script', 'XHR', 'Style', 'Image', 'Other'];
    var that = this;
    return React.createElement(
      'div',
      { className: 'outer' },
      React.createElement(
        'div',
        { className: 'filter-title' },
        React.createElement('i', { className: 'fa fa-search' }),
        React.createElement('input', { list: 'allTypes', className: 'filter-input', type: 'text', placeholder: 'Filter', onInput: this.changeFilterStr }),
        React.createElement(
          'span',
          { className: 'filter-type' },
          types.map(function (type, i) {
            var className = '';
            if (type === that.state.filterType) {
              className = 'active';
            }
            return React.createElement(
              'a',
              { href: '###', key: i, type: type, onClick: that.changeFilterType, className: className },
              type
            );
          })
        )
      ),
      React.createElement(TableComponent, { filter: this.state })
    );
  }
});

var TableComponent = React.createClass({
  displayName: 'TableComponent',

  getInitialState: function getInitialState() {
    return {
      datas: [],
      selectedData: null
    };
  },
  componentWillMount: function componentWillMount() {
    var that = this,
        timer = null;
    ipc.send('main:ready', 'ready');
    ipc.on('requestData', function (requestInfo) {
      var datas = that.state.datas;
      datas.push(requestInfo);

      clearTimeout(timer);
      timer = setTimeout(function () {
        that.setState({
          datas: datas
        });
      }, 30);
    });

    ipc.on('clearRequestData', function () {
      that.setState({
        datas: []
      });

      if (that.connectNumNode) {
        that.connectNumNode.innerText = 0;
      }
    });
  },
  componentWillUpdate: function componentWillUpdate() {
    var conectionNum = this.state.datas.length;
    if (!this.connectNumNode) {
      this.connectNumNode = document.getElementById('connectNum');
    }
    this.connectNumNode.innerText = conectionNum;
  },
  componentDidUpdate: function componentDidUpdate() {
    // clearTimeout(this.timer);
    // if(this.noscroll || this.state.selectedData) {
    //   this.noscroll = true;
    //   return false;
    // }
    // var that = this;
    // this.timer = setTimeout(function() {
    //   var tbody = that.refs.tbody.getDOMNode();
    //   var scrollHeight = tbody.scrollHeight;
    //   tbody.scrollTop = scrollHeight;
    // }, 20);
  },
  updateCancelFn: function updateCancelFn(fn) {
    this.cancelFn = fn;
  },
  cancelSelect: function cancelSelect() {
    if (this.cancelFn) {
      this.cancelFn();
    }
    this.setState({
      selectedData: null
    });
  },
  updateSelectedData: function updateSelectedData(selectedData) {
    this.setState({
      selectedData: selectedData
    });
  },
  scrollRender: function scrollRender() {
    // console.log('scroll');
  },
  render: function render() {
    var that = this;
    return React.createElement(
      'div',
      { className: 'table-outer' },
      React.createElement(
        'table',
        { className: 'pure-table' },
        React.createElement(
          'thead',
          null,
          React.createElement(
            'tr',
            null,
            React.createElement(
              'th',
              null,
              'Name'
            ),
            React.createElement(
              'th',
              { className: 'text-tr' },
              'Method'
            ),
            React.createElement(
              'th',
              null,
              'Status'
            ),
            React.createElement(
              'th',
              null,
              'Type'
            ),
            React.createElement(
              'th',
              { className: 'text-tr' },
              'Size'
            ),
            React.createElement(
              'th',
              { className: 'text-tr' },
              'Time'
            )
          )
        ),
        React.createElement(
          'tbody',
          { ref: 'tbody', onScroll: this.scrollRender },
          React.createElement('tr', { className: 'top-tr' }),
          this.state.datas.map(function (data) {
            return React.createElement(TrComponent, _extends({}, that.props, {
              key: data.id,
              data: data,
              updateSelectedData: that.updateSelectedData,
              cancelSelect: that.cancelSelect,
              updateCancelFn: that.updateCancelFn }));
          }),
          React.createElement('tr', { className: 'bottom-tr' })
        )
      ),
      React.createElement(DetailComponent, { cancelSelect: this.cancelSelect, selectedData: this.state.selectedData })
    );
  }
});

TrComponent = React.createClass({
  displayName: 'TrComponent',

  getInitialState: function getInitialState() {
    return {
      selected: false
    };
  },
  select: function select() {
    this.props.cancelSelect();
    this.setState({
      selected: true
    });
    this.props.updateCancelFn(this.cancelSelect);

    var requestData = this.props.data;
    if (requestData.fileType) {
      requestData.fileType = this.fileType;
    }
    this.props.updateSelectedData(requestData);
  },
  cancelSelect: function cancelSelect() {
    this.setState({
      selected: false
    });
  },
  componentDidMount: function componentDidMount() {
    var that = this;
    if (!this.refs.reqItem) {
      return false;
    }

    var node = this.refs.reqItem.getDOMNode();

    var requestData = that.props.data;

    var menu = new Menu();
    menu.append(new MenuItem({ label: 'Copy Request Headers', click: function click() {
        var reqHeaderStr = '';
        Object.keys(requestData.reqHeader).forEach(function (k) {
          reqHeaderStr += k + ': ' + requestData.reqHeader[k] + '\n';
        });

        clipboard.writeText(reqHeaderStr);
      } }));
    menu.append(new MenuItem({ label: 'Copy Response Headers', click: function click() {
        var resHeaderStr = '';
        Object.keys(requestData.resHeader).forEach(function (k) {
          resHeaderStr += k + ': ' + requestData.resHeader[k] + '\n';
        });

        clipboard.writeText(resHeaderStr);
      } }));
    menu.append(new MenuItem({ label: 'Copy Response', click: function click() {
        clipboard.writeText(requestData.resBody);
      } }));
    menu.append(new MenuItem({ label: 'Copy as cURL', click: function click() {
        var curlCmd = "curl '" + requestData.url + "' ";
        Object.keys(requestData.reqHeader).forEach(function (k) {
          curlCmd += "-H '" + k + ": " + requestData.reqHeader[k] + "' ";
        });

        if (requestData.reqBody && Object.keys(requestData.reqBody).length) {
          var curlDataStr = '';
          Object.keys(requestData.reqBody).forEach(function (k) {
            curlDataStr += k + "=" + encodeURIComponent(requestData.reqBody[k]);
          });
          curlCmd += "-d '" + curlDataStr;
        }

        curlCmd = curlCmd.trim();
        curlCmd += " --compressed";

        clipboard.writeText(curlCmd);
      } }));
    menu.append(new MenuItem({ label: 'Copy Link Address', click: function click() {
        clipboard.writeText(requestData.url);
      } }));

    node.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      menu.popup(remote.getCurrentWindow());
    }, false);
  },
  getFileType: function getFileType(requestData) {
    var ext = requestData.path.replace(/\?.*/, '').split('.');
    if (ext.length > 1) {
      ext = ext[ext.length - 1];
    } else {
      ext = '';
    }

    if (ext === 'js' || /script/.test(requestData.resHeader['content-type'])) {
      return 'script';
    } else if (ext === 'css' || /style/.test(requestData.resHeader['content-type'])) {
      return 'style';
    } else if (ext === 'json' || /json/.test(requestData.resHeader['content-type'])) {
      return 'json';
    }

    if (/image/.test(requestData.resHeader['content-type'])) {
      return 'image';
    }

    return ext || 'other';
  },
  notMatchFilter: function notMatchFilter(requestData, type) {
    var url = requestData.url;
    var filterStr = this.props.filter.filterStr.toLowerCase();
    var filterType = this.props.filter.filterType.toLowerCase();
    if (filterType === 'all') {
      filterType = '';
    }

    if (filterStr && url.indexOf(filterStr) === -1) {
      return true;
    }

    if (!filterType) {
      return false;
    }
    if (filterType === 'xhr' && requestData.reqHeader['x-requested-with']) {
      return false;
    }

    if (filterType !== type) {
      return true;
    }

    return false;
  },
  render: function render() {
    var requestData = this.props.data;

    requestData.statusMessage = StatusMessage[requestData.statusCode];

    var contentType = requestData.resHeader['content-type'];
    if (contentType) {
      contentType = contentType.split(';')[0];
    }
    var ext = requestData.path.replace(/\?.*/, '').split('.');
    if (ext.length > 1) {
      ext = ext[ext.length - 1];
    } else {
      ext = '';
    }

    var type = this.getFileType(requestData);
    this.fileType = type;

    var iconClassNameEnum = {
      'script': 'icon icon-javascript',
      'json': 'icon icon-database',
      'style': 'icon icon-css',
      'image': 'fa fa-picture-o',
      'php': 'icon icon-php-alt',
      'other': 'icon icon-script-alt'
    };
    var iconClassName = iconClassNameEnum[type] || 'icon icon-script-alt';

    var className = '';
    if (this.state.selected) {
      className = 'active';
    }

    var isHide = this.notMatchFilter(requestData, type);
    if (isHide) {
      return false;
      className += ' hide';
    }

    if (requestData.statusCode > 400) {
      className += ' error-text';
    }

    var largeSize = Math.ceil(requestData.length / 1024);
    var largeText = largeSize + ' kb';
    if (largeSize && largeSize < 1) {
      largeText = requestData.length + ' b';
    }

    if (!largeSize) {
      largeText = '';
    }

    var pathEl = React.createElement(
      'li',
      { className: 'pure-menu-item' },
      requestData.path
    );
    if (requestData.protocol === 'https') {
      pathEl = React.createElement(
        'li',
        { className: 'pure-menu-item' },
        React.createElement('i', { className: 'fa fa-lock' }),
        requestData.path
      );
    }

    return React.createElement(
      'tr',
      { ref: 'reqItem', className: className, onClick: this.select },
      React.createElement(
        'td',
        null,
        React.createElement('i', { className: iconClassName }),
        React.createElement(
          'ul',
          { className: 'pure-menu-list' },
          pathEl,
          React.createElement(
            'li',
            { className: 'pure-menu-item' },
            requestData.host
          )
        )
      ),
      React.createElement(
        'td',
        { className: 'text-tr' },
        requestData.method
      ),
      React.createElement(
        'td',
        null,
        React.createElement(
          'ul',
          { className: 'pure-menu-list' },
          React.createElement(
            'li',
            { className: 'pure-menu-item' },
            requestData.statusCode
          ),
          React.createElement(
            'li',
            { className: 'pure-menu-item' },
            requestData.statusMessage
          )
        )
      ),
      React.createElement(
        'td',
        null,
        React.createElement(
          'ul',
          { className: 'pure-menu-list' },
          React.createElement(
            'li',
            { className: 'pure-menu-item' },
            contentType
          )
        )
      ),
      React.createElement(
        'td',
        { className: 'text-tr' },
        largeText
      ),
      React.createElement(
        'td',
        { className: 'text-tr' },
        requestData.duration,
        ' ms'
      )
    );
  }
});

DetailComponent = React.createClass({
  displayName: 'DetailComponent',

  getInitialState: function getInitialState() {
    return {
      closed: true
    };
  },
  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    if (!nextProps.selectedData) {
      this.setState({
        closed: false
      });
    }
  },
  shouldComponentUpdate: function shouldComponentUpdate(nextProps, nextState) {
    if (this.state.closed !== nextState.closed) {
      return true;
    }

    if (!nextProps.selectedData && this.props.selectedData) {
      return true;
    }

    if (!nextProps.selectedData) {
      return false;
    }

    if (this.props.selectedData && this.props.selectedData.id == nextProps.selectedData.id) {
      return false;
    }

    return true;
  },
  componentDidMount: function componentDidMount() {
    var that = this;
    ipc.on('main:closeDetail', function () {
      that.close();
    });
  },
  close: function close() {
    this.props.cancelSelect();
  },
  render: function render() {
    if (this.state.closed || !this.props.selectedData) {
      return React.createElement('div', { className: 'detail hide' });
    }

    return React.createElement(
      'div',
      { className: 'detail' },
      React.createElement(DetailTabComponent, _extends({ close: this.close }, this.props))
    );
  }
});

DetailTabComponent = React.createClass({
  displayName: 'DetailTabComponent',

  getInitialState: function getInitialState() {
    this.tabs = ['Header', 'Response'];
    return {
      selected: 'Header'
    };
  },
  changeTab: function changeTab(e) {
    var text = e.target.innerText;
    this.setState({
      selected: text
    });
  },
  addCopyMenu: function addCopyMenu() {
    var that = this;
    if (!this.refs.img) {
      return false;
    }
    var node = this.refs.img.getDOMNode();

    if (node.dataset['_hasBindCopy']) {
      return false;
    }
    node.dataset['_hasBindCopy'] = 1;

    var requestData = this.props.selectedData;
    var menu = new Menu();
    menu.append(new MenuItem({ label: 'Copy Image URL', click: function click() {
        clipboard.writeText(requestData.url);
      } }));

    menu.append(new MenuItem({ label: 'Copy Image As Data URL', click: function click() {
        var copyText = 'data:image/png;base64,' + requestData.resBody;
        clipboard.writeText(copyText);
      } }));

    node.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      menu.popup(remote.getCurrentWindow());
    }, false);
  },
  copyResBody: function copyResBody() {
    var node = this.refs.codeBlock.getDOMNode();
    var requestData = this.props.selectedData;
    var menu = new Menu();
    menu.append(new MenuItem({ label: 'Copy Response Body', click: function click() {
        clipboard.writeText(requestData.resBody);
      } }));

    node.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      menu.popup(remote.getCurrentWindow());
    }, false);
  },
  componentDidMount: function componentDidMount() {
    this.addCopyMenu();
  },
  componentDidUpdate: function componentDidUpdate() {
    this.addCopyMenu();

    if (this.refs.tabContents) {
      this.refs.tabContents.getDOMNode().scrollTop = 0;
    }
  },
  render: function render() {
    var that = this;
    var requestData = this.props.selectedData;

    var statusCodeClass = 'item-value';
    if (requestData.statusCode > 400) {
      statusCodeClass = 'item-value error-text';
    }

    var responseText;
    if (requestData.resBody && /(script|text|css|html|json|xml)/.test(requestData.resHeader['content-type'])) {
      responseText = React.createElement(
        'pre',
        { ref: 'codeBlock', onClick: this.copyResBody },
        requestData.resBody
      );
    } else if (requestData.resBody && /image/.test(requestData.resHeader['content-type'])) {
      var src = 'data:image/png;base64,' + requestData.resBody;
      responseText = React.createElement('img', { ref: 'img', src: src });
    } else {
      responseText = React.createElement(
        'div',
        { className: 'text-info' },
        'No Data In This Request.'
      );
    }

    var queryComponent;
    if (Object.keys(requestData.params).length) {
      queryComponent = React.createElement(
        'div',
        null,
        React.createElement(
          'h3',
          null,
          'Query Params'
        ),
        React.createElement(
          'ul',
          { className: 'pure-menu-list req' },
          Object.keys(requestData.params).map(function (key, i) {
            return React.createElement(
              'li',
              { key: i },
              React.createElement(
                'strong',
                { className: 'item-key' },
                key,
                ': '
              ),
              React.createElement(
                'span',
                { className: 'item-value' },
                decodeURIComponent(requestData.params[key])
              )
            );
          })
        )
      );
    }

    var formDataComponent;
    if (Object.keys(requestData.reqBody).length) {
      formDataComponent = React.createElement(
        'div',
        null,
        React.createElement(
          'h3',
          null,
          'Form Data'
        ),
        React.createElement(
          'ul',
          { className: 'pure-menu-list req' },
          Object.keys(requestData.reqBody).map(function (key, i) {
            return React.createElement(
              'li',
              { key: i },
              React.createElement(
                'strong',
                { className: 'item-key' },
                key,
                ': '
              ),
              React.createElement(
                'span',
                { className: 'item-value' },
                requestData.reqBody[key]
              )
            );
          })
        )
      );
    }

    return React.createElement(
      'div',
      { className: 'outer' },
      React.createElement(
        'div',
        { className: 'pure-menu pure-menu-horizontal tabs' },
        React.createElement('i', { className: 'fa fa-times close', ref: 'closeBtn', onClick: this.props.close }),
        React.createElement(
          'ul',
          { className: 'pure-menu-list' },
          this.tabs.map(function (item, i) {
            var className = 'pure-menu-item';
            if (that.state.selected === item) {
              className += ' selected';
            }
            return React.createElement(
              'li',
              { key: i, className: className, onClick: that.changeTab },
              item
            );
          })
        )
      ),
      React.createElement(
        'div',
        { className: 'tab-contents', ref: 'tabContents' },
        React.createElement(
          'div',
          { className: this.state.selected === 'Header' ? 'tab-content' : 'tab-content hide' },
          React.createElement(
            'h3',
            null,
            'General'
          ),
          React.createElement(
            'ul',
            { className: 'pure-menu-list general' },
            React.createElement(
              'li',
              null,
              React.createElement(
                'strong',
                { className: 'item-key' },
                'Remote Address:'
              ),
              React.createElement(
                'span',
                { className: 'item-value' },
                '203.208.52.143:80'
              )
            ),
            React.createElement(
              'li',
              null,
              React.createElement(
                'strong',
                { className: 'item-key' },
                'Reques Url:'
              ),
              React.createElement(
                'span',
                { className: 'item-value' },
                requestData.url
              )
            ),
            React.createElement(
              'li',
              null,
              React.createElement(
                'strong',
                { className: 'item-key' },
                'Transfer Protocol:'
              ),
              React.createElement(
                'span',
                { className: 'item-value' },
                requestData.protocol
              )
            ),
            React.createElement(
              'li',
              null,
              React.createElement(
                'strong',
                { className: 'item-key' },
                'Request Method:'
              ),
              React.createElement(
                'span',
                { className: 'item-value' },
                requestData.method
              )
            ),
            React.createElement(
              'li',
              null,
              React.createElement(
                'strong',
                { className: 'item-key' },
                'Status Code:'
              ),
              React.createElement(
                'span',
                { className: statusCodeClass },
                requestData.statusCode + ' ' + requestData.statusMessage
              )
            )
          ),
          React.createElement(
            'h3',
            null,
            'Response Header'
          ),
          React.createElement(
            'ul',
            { className: 'pure-menu-list res' },
            Object.keys(requestData.resHeader).map(function (key, i) {
              return React.createElement(
                'li',
                { key: i },
                React.createElement(
                  'strong',
                  { className: 'item-key' },
                  key,
                  ': '
                ),
                React.createElement(
                  'span',
                  { className: 'item-value' },
                  requestData.resHeader[key]
                )
              );
            })
          ),
          React.createElement(
            'h3',
            null,
            'Request Header'
          ),
          React.createElement(
            'ul',
            { className: 'pure-menu-list req' },
            Object.keys(requestData.reqHeader).map(function (key, i) {
              return React.createElement(
                'li',
                { key: i },
                React.createElement(
                  'strong',
                  { className: 'item-key' },
                  key,
                  ': '
                ),
                React.createElement(
                  'span',
                  { className: 'item-value' },
                  requestData.reqHeader[key]
                )
              );
            })
          ),
          queryComponent,
          formDataComponent
        ),
        React.createElement(
          'div',
          { className: this.state.selected === 'Response' ? 'tab-content' : 'tab-content hide' },
          responseText
        )
      )
    );
  }
});

React.render(React.createElement(ReactApp, null), document.getElementById('main'));

React.render(React.createElement(ReactMenu, null), document.getElementById('menuTools'));