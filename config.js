let LOCAL_HOST = 'http://127.0.0.1'
let PROXY_SERVER_PROT = 3000
let SERVER_PORT = 5000
let FAKE_SERVER_PORT = 3002

export default {
  port: SERVER_PORT,

  useFakeServer: false,
  fakeServer: {
    port: FAKE_SERVER_PORT
  },

  proxyType: 'remote',
  proxy: {
    port: PROXY_SERVER_PROT,
    fake: LOCAL_HOST + ':' + FAKE_SERVER_PORT,
    local: 'http://192.168.3.2',
    remote: 'http://forehead.highborn.cn'
  }
}