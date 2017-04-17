import ncp from 'ncp';

export default (source, dest) => new Promise((resolve, reject) => {
  ncp(source, dest, {
    clobber: true
  }, err => {
    if (err) {
      console.error(err)
      return reject(err)
    }
    return resolve()
  })
});
