import getConmmonConfig from './webpack/common.config'
import getAppConfig from './webpack/app.config'
import getDLLConfig from './webpack/dll.config'

let WATCH = process.env.NODE_ENV === 'production' ? false : global.WATCH;
const DEBUG = process.env.NODE_ENV !== 'production';
const VERBOSE = process.argv.includes('verbose');

//
// Common configuration chunk to be used for both
// client-side (app.js) and server-side (server.js) bundles
// -----------------------------------------------------------------------------

const config = getConmmonConfig(DEBUG, VERBOSE)

function getConfig(type) {
  switch(type) {
    case 'dll':
      return getDLLConfig(config);
      break;
    default:
      return getAppConfig(config ,WATCH, DEBUG, VERBOSE);
      break;
  }
}

export {getConfig}
