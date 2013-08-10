var config = {
  realm: 'your.realm.org', 
  impi: 'username', 
  impu: 'sip:username@your.realm.org',
  password: 'password',
  enable_rtcweb_breaker: true,
  outbound_proxy_url: 'udp://your.sip.server.org:5060',
  websocket_proxy_url: 'wss://server.with.webrtc2sip.installed.org:10062',
  ice_servers: [{"url":"turn:your.resiprocate.server.org:3478"}]
}
