import del from 'del';
import task from './lib/task';

/**
 * Cleans up the output (build) directory.
 */
module.exports = task('clean', async () => {
  await del(['www/*'], {dot: true});
});
