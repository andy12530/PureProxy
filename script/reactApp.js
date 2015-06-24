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
  getInitialState: function() {
    return {
      started: true
    };
  },
  toggleStart: function(event) {
    var isStarted = this.state.started;
    if(!isStarted) {
      this.sendClearRequestData();
    }

    this.setState({
      started: !isStarted
    });

    ipc.send('main:startListenReq', !isStarted);
  },
  sendClearRequestData: function() {
    ipc.send('main:clearRequestData');
  },
  showQRCode: function() {
    ipc.send('main:showQRCodeDialog');
  },
  componentDidMount: function() {
    var node = document.getElementById('proxyAddress');
    ipc.on('main:proxyAddress', function(proxyAddress) {
      node.innerText = proxyAddress;
    });

    var menu = new Menu();
    menu.append(new MenuItem({ label: 'Copy Proxy Address', click: function() {
      clipboard.writeText(node.innerText);
    }}));

    node.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      menu.popup(remote.getCurrentWindow());
    }, false);

  },
  render: function() {
    var text = 'Start';
    var className = 'fa fa-play';
    var btnClass = 'pure-button btn-w120';
    if(this.state.started) {
      text = 'Running';
      className = 'fa fa-circle-o-notch fa-spin fa-fw margin-bottom';
      btnClass = 'pure-button btn-w120 button-cat';
    }

    return (
      <div>
        <button className={btnClass} onClick={this.toggleStart}>
            <i className={className}></i>
            {text}
        </button>
        <button className="pure-button button-warning" onClick={this.sendClearRequestData}>
            <i className="fa fa-trash-o"></i>
            Clear (Cmd+X)
        </button>
        <span className="split"></span>
        <button className="pure-button button-success" onClick={this.showQRCode}>
            <i className="fa fa-qrcode"></i>
            Download QR rootCA
        </button>
        <ul className="connect-info pure-menu-list">
          <li><strong>Proxy Address :</strong> <span id="proxyAddress"></span></li>
          <li><strong>Connection :</strong> <span id="connectNum">0</span></li>
        </ul>
      </div>
      );
  }
});

var ReactApp = React.createClass({
  getInitialState: function() {
    return {
      filterStr: '',
      filterType: 'All'
    };
  },
  changeFilterType: function(e) {
    var type = e.target.text;
    this.setState({
      filterType: type
    });
  },
  changeFilterStr: function(e) {
    var str = e.target.value;
    str = str.trim();
    this.setState({
      filterStr: str
    });
  },
  render: function() {
    var types = ['All', 'Script', 'XHR', 'Style', 'Image', 'Other'];
    var that = this;
    return (
      <div className="outer">
        <div className="filter-title">
            <i className="fa fa-search"></i>
            <input list="allTypes" className="filter-input" type="text" placeholder="Filter" onInput={this.changeFilterStr} />
            <span className="filter-type">
              {types.map(function(type, i) {
                var className = '';
                if(type === that.state.filterType) {
                  className = 'active';
                }
                return <a href="###" key={i} type={type} onClick={that.changeFilterType} className={className}>{type}</a>;
              })}
            </span>
        </div>
        <TableComponent filter={this.state} />
      </div>
      );
  }
});

var TableComponent = React.createClass({
  getInitialState: function () {
      return {
        datas: [],
        selectedData: null
      };
  },
  componentWillMount: function() {
    var that = this, timer = null;
    ipc.send('main:ready', 'ready');
    ipc.on('requestData', function(requestInfo) {
        var datas = that.state.datas;
        datas.push(requestInfo);

        clearTimeout(timer);
        timer = setTimeout(function() {
          that.setState({
            datas: datas
          });
        }, 30);
    });

    ipc.on('clearRequestData', function() {
      that.setState({
        datas: []
      })

      if(that.connectNumNode) {
        that.connectNumNode.innerText = 0;
      }
    });

    ipc.on('main:resize', function() {
      console.log('resize');
    });
  },
  componentWillUpdate: function() {
    var conectionNum = this.state.datas.length;
    if(!this.connectNumNode) {
      this.connectNumNode = document.getElementById('connectNum');
    }
    this.connectNumNode.innerText = conectionNum;
  },
  componentDidUpdate: function() {
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
  updateCancelFn: function(fn) {
    this.cancelFn = fn;
  },
  cancelSelect: function() {
    if(this.cancelFn) {
      this.cancelFn();
    }
    this.setState({
      selectedData: null
    });
  },
  updateSelectedData: function(selectedData) {
    this.setState({
      selectedData: selectedData
    });
  },
  scrollRender: function() {
    console.log('scroll');
  },
  render: function() {
    var that = this;
    return (
      <div className="table-outer">
        <table className="pure-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th className="text-tr">Method</th>
                    <th>Status</th>
                    <th>Type</th>
                    <th className="text-tr">Size</th>
                    <th className="text-tr">Time</th>
                </tr>
            </thead>
            <tbody ref="tbody" onScroll={this.scrollRender}>
              <tr className="top-tr"></tr>
              {this.state.datas.map(function(data) {
                return <TrComponent {...that.props}
                  key={data.id}
                  data={data}
                  updateSelectedData={that.updateSelectedData}
                  cancelSelect={that.cancelSelect}
                  updateCancelFn={that.updateCancelFn} />
              })}
              <tr className="bottom-tr"></tr>
            </tbody>
        </table>
        <DetailComponent cancelSelect={this.cancelSelect} selectedData={this.state.selectedData} />
      </div>
      )
  }
});

TrComponent = React.createClass({
  getInitialState: function () {
    return {
      selected: false
    };
  },
  select: function() {
    this.props.cancelSelect();
    this.setState({
      selected: true
    });
    this.props.updateCancelFn(this.cancelSelect);

    var requestData = this.props.data;
    if(requestData.fileType) {
      requestData.fileType = this.fileType
    }
    this.props.updateSelectedData(requestData);
  },
  cancelSelect: function() {
    this.setState({
      selected: false
    });
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    if(this.state.selected != nextState.selected) {
      return true;
    }

    if(this.props.data && nextProps.data.id === this.props.data.id) {
      return false;
    }
    return true;
  },
  componentDidMount: function () {
      var that = this;
      var node = this.refs.reqItem.getDOMNode();

      var requestData = that.props.data;

      var menu = new Menu();
      menu.append(new MenuItem({ label: 'Copy Request Headers', click: function() {
        var reqHeaderStr = '';
        Object.keys(requestData.reqHeader).forEach(function(k){
          reqHeaderStr += k + ': ' + requestData.reqHeader[k] + '\n';
        });

        clipboard.writeText(reqHeaderStr);
      }}));
      menu.append(new MenuItem({ label: 'Copy Response Headers', click: function() {
        var resHeaderStr = '';
        Object.keys(requestData.resHeader).forEach(function(k){
          resHeaderStr += k + ': ' + requestData.resHeader[k] + '\n';
        });

        clipboard.writeText(resHeaderStr);
      }}));
      menu.append(new MenuItem({ label: 'Copy Response', click: function() {
        clipboard.writeText(requestData.resBody);
      }}));
      menu.append(new MenuItem({ label: 'Copy as cURL', click: function() {
        var curlCmd = "curl '"+ requestData.url +"' ";
        Object.keys(requestData.reqHeader).forEach(function(k){
          curlCmd += "-H '" + k + ": " + requestData.reqHeader[k] + "' ";
        });

        if(requestData.reqBody) {
          curlCmd += "-d '" + requestData.reqBody + "' ";
        }

        curlCmd = curlCmd.trim();
        curlCmd += " --compressed";

        clipboard.writeText(curlCmd);
      }}));
      menu.append(new MenuItem({ label: 'Copy Link Address', click: function() {
        clipboard.writeText(requestData.url);
      }}));

      node.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        menu.popup(remote.getCurrentWindow());
      }, false);
  },
  getFileType: function(requestData) {
    var ext = requestData.path.replace(/\?.*/, '').split('.');
    if(ext.length > 1) {
      ext = ext[ext.length - 1];
    } else {
      ext = '';
    }

    if(ext === 'js' || /script/.test(requestData.resHeader['content-type'])) {
      return 'script';
    } else if(ext === 'css' || /style/.test(requestData.resHeader['content-type'])) {
      return 'style';
    } else if(ext === 'json' || /json/.test(requestData.resHeader['content-type'])) {
      return 'json';
    }

    if(/image/.test(requestData.resHeader['content-type'])) {
      return 'image';
    }

    return ext || 'other';
  },
  notMatchFilter: function(requestData, type) {
    var url = requestData.url;
    var filterStr = this.props.filter.filterStr.toLowerCase();
    var filterType = this.props.filter.filterType.toLowerCase();
    if(filterType === 'all') {
      filterType = '';
    }

    if(filterStr && url.indexOf(filterStr) === -1){
      return true;
    }

    if(!filterType) {
      return false;
    }

    if(filterType === 'xhr' && requestData.reqHeader['X-Requested-With']) {
      return true;
    }

    if(filterType !== type) {
      return true;
    }

    return false;
  },
  render: function() {
    var requestData = this.props.data;

    requestData.statusMessage = StatusMessage[requestData.statusCode];

    var contentType = requestData.resHeader['content-type'];
    if(contentType) {
      contentType = contentType.split(';')[0];
    }
    var ext = requestData.path.replace(/\?.*/, '').split('.');
    if(ext.length > 1) {
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
    if(this.state.selected) {
      className = 'active';
    }

    var isHide = this.notMatchFilter(requestData, type);
    if(isHide) {
      className += ' hide';
    }

    if(requestData.statusCode > 400) {
      className += ' error-text';
    }

    var largeSize = Math.ceil(requestData.length / 1024);
    var largeText = largeSize + ' kb';
    if(largeSize && largeSize < 1) {
      largeText = requestData.length + ' b';
    }

    if(!largeSize) {
      largeText = '';
    }

    var pathEl = <li className="pure-menu-item">{requestData.path}</li>
    if(requestData.protocol === 'https') {
      pathEl = <li className="pure-menu-item"><i className="fa fa-lock"></i>{requestData.path}</li>
    }

    return (
      <tr ref="reqItem" className={className} onClick={this.select}>
          <td>
              <i className={iconClassName}></i>
              <ul className="pure-menu-list">
                  {pathEl}
                  <li className="pure-menu-item">{requestData.host}</li>
              </ul>
          </td>
          <td className="text-tr">{requestData.method}</td>
          <td>
              <ul className="pure-menu-list">
                  <li className="pure-menu-item">{requestData.statusCode}</li>
                  <li className="pure-menu-item">{requestData.statusMessage}</li>
              </ul>
          </td>
          <td>
              <ul className="pure-menu-list">
                  <li className="pure-menu-item">{contentType}</li>
              </ul>
          </td>
          <td className="text-tr">{largeText}</td>
          <td className="text-tr">{requestData.duration} ms</td>
      </tr>
      );
  }
});

DetailComponent = React.createClass({
  getInitialState: function () {
      return {
          closed: true
      };
  },
  componentWillReceiveProps: function(nextProps) {
    if(!nextProps.selectedData) {
      this.setState({
        closed: false
      });
    }
  },
  shouldComponentUpdate: function (nextProps, nextState) {
    if(this.state.closed !== nextState.closed) {
      return true;
    }

    if(!nextProps.selectedData && this.props.selectedData) {
      return true;
    }

    if(!nextProps.selectedData) {
      return false;
    }

    if(this.props.selectedData && (this.props.selectedData.id == nextProps.selectedData.id)) {
      return false;
    }

    return true;
  },
  componentDidMount: function() {
    var that = this;
    ipc.on('main:closeDetail', function() {
      that.close();
    });
  },
  close: function() {
    this.props.cancelSelect();
  },
  render: function() {
    if(this.state.closed || !this.props.selectedData) {
      return (
        <div className="detail hide"></div>
        )
    }

    return (
      <div className="detail">
        <DetailTabComponent close={this.close} {...this.props} />
      </div>
      );
  }
});

DetailTabComponent = React.createClass({
  getInitialState: function() {
    this.tabs = ['Header', 'Preview', 'Response'];
    return {
      selected: 'Header'
    };
  },
  changeTab: function(e) {
    var text = e.target.innerText;
    this.setState({
      selected: text
    });
  },
  addCopyMenu: function() {
    var that = this;
    if(!this.refs.img) {
      return false;
    }
    var node = this.refs.img.getDOMNode();

    if(node.dataset['_hasBindCopy']) {
      return false;
    }
    node.dataset['_hasBindCopy'] = 1;

    var requestData = this.props.selectedData;
    var menu = new Menu();
    menu.append(new MenuItem({ label: 'Copy Image URL', click: function() {
      clipboard.writeText(requestData.url);
    }}));

    menu.append(new MenuItem({ label: 'Copy Image As Data URL', click: function() {
      var copyText = 'data:image/png;base64,' + requestData.resBody;
      clipboard.writeText(copyText);
    }}));

    node.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      menu.popup(remote.getCurrentWindow());
    }, false);
  },
  copyResBody: function() {
    var node = this.refs.codeBlock.getDOMNode();
    var requestData = this.props.selectedData;
    var menu = new Menu();
    menu.append(new MenuItem({ label: 'Copy Response Body', click: function() {
      clipboard.writeText(requestData.resBody);
    }}));

    node.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      menu.popup(remote.getCurrentWindow());
    }, false);
  },
  componentDidMount: function () {
    this.addCopyMenu();
  },
  componentDidUpdate: function() {
    this.addCopyMenu();

    if(this.refs.tabContents) {
      this.refs.tabContents.getDOMNode().scrollTop = 0;
    }
  },
  render: function() {
    var that = this;
    var requestData = this.props.selectedData;
    var statusCodeClass = 'item-value';
    if(requestData.statusCode > 400) {
      statusCodeClass = 'item-value error-text';
    }

    var responseText;
    if(requestData.resBody && /(script|text|css|html|json|xml)/.test(requestData.resHeader['content-type'])) {
      responseText = <pre ref="codeBlock" onClick={this.copyResBody}>{requestData.resBody}</pre>;
    } else {
      responseText = <div className="text-info">No Data In This Request.</div>;
    }

    var previewText;
    if(requestData.resBody && /image/.test(requestData.resHeader['content-type'])) {
      var src = 'data:image/png;base64,' + requestData.resBody;
      previewText = <img ref="img" src={src} />
    } else {
      previewText = <div className="text-info">No Preview In This Request.</div>;
    }

    var queryComponent;
    if(Object.keys(requestData.params).length) {
      queryComponent =  (
        <div>
          <h3>Query Params</h3>
          <ul className="pure-menu-list req">
            {Object.keys(requestData.params).map(function(key, i) {
              return (
                  <li key={i}>
                    <strong className="item-key">{key}: </strong>
                    <span className="item-value">{requestData.params[key]}</span>
                  </li>
                );
            })}
          </ul>
        </div>
      );
    }

    var formDataComponent;
    if(Object.keys(requestData.reqBody).length) {
      formDataComponent =  (
        <div>
          <h3>Form Data</h3>
          <ul className="pure-menu-list req">
            {Object.keys(requestData.reqBody).map(function(key, i) {
              return (
                  <li key={i}>
                    <strong className="item-key">{key}: </strong>
                    <span className="item-value">{requestData.reqBody[key]}</span>
                  </li>
                );
            })}
          </ul>
        </div>
      )
    }

    return (
      <div className="outer">
        <div className="pure-menu pure-menu-horizontal tabs">
          <i className="fa fa-times close" ref="closeBtn" onClick={this.props.close}></i>
          <ul className="pure-menu-list">
          {this.tabs.map(function(item, i) {
            var className = 'pure-menu-item';
            if(that.state.selected === item) {
              className += ' selected';
            }
            return (
              <li key={i} className={className} onClick={that.changeTab}>{item}</li>
              )
          })}
          </ul>
        </div>
        <div className="tab-contents" ref="tabContents">
          <div className={this.state.selected === 'Header'?  'tab-content': 'tab-content hide' }>
            <h3>General</h3>
            <ul className="pure-menu-list general">
              <li>
                <strong className="item-key">Remote Address:</strong>
                <span className="item-value">203.208.52.143:80</span>
              </li>
              <li>
                <strong className="item-key">Reques Url:</strong>
                <span className="item-value">{requestData.url}</span>
              </li>
              <li>
                <strong className="item-key">Transfer Protocol:</strong>
                <span className="item-value">{requestData.protocol}</span>
              </li>
              <li>
                <strong className="item-key">Request Method:</strong>
                <span className="item-value">{requestData.method}</span>
              </li>
              <li>
                <strong className="item-key">Status Code:</strong>
                <span className={statusCodeClass}>{requestData.statusCode + ' ' + requestData.statusMessage}</span>
              </li>
            </ul>
            <h3>Response Header</h3>
            <ul className="pure-menu-list res">
              {Object.keys(requestData.resHeader).map(function(key, i) {
                return (
                    <li key={i}>
                      <strong className="item-key">{key}: </strong>
                      <span className="item-value">{requestData.resHeader[key]}</span>
                    </li>
                  );
              })}
            </ul>
            <h3>Request Header</h3>
            <ul className="pure-menu-list req">
              {Object.keys(requestData.reqHeader).map(function(key, i) {
                return (
                    <li key={i}>
                      <strong className="item-key">{key}: </strong>
                      <span className="item-value">{requestData.reqHeader[key]}</span>
                    </li>
                  );
              })}
            </ul>
            {queryComponent}
            {formDataComponent}
          </div>
          <div className={this.state.selected === 'Preview'?  'tab-content': 'tab-content hide' }>
            {previewText}
          </div>
          <div className={this.state.selected === 'Response'?  'tab-content': 'tab-content hide' }>
            {responseText}
          </div>
        </div>
      </div>
      )
  }
});


React.render(
  <ReactApp />,
  document.getElementById('main')
);

React.render(
  <ReactMenu />,
  document.getElementById('menuTools')
);