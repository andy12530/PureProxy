module.exports.getLocalIP = function() {
  var os = require('os');
  var ifaces = os.networkInterfaces();

  var localIP;
  Object.keys(ifaces).forEach(function(ifname) {
    if (localIP) {
      return false;
    }
    ifaces[ifname].forEach(function(iface) {
      if ('IPv4' !== iface.family || iface.internal !== false) {
        return;
      }

      if (iface.address) {
        localIP = iface.address;
      }
    });
  });
  return localIP;
};
