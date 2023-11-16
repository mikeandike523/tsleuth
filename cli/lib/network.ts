import http from 'http';

/**
 *
 * Checks if a network port is available
 *
 * @param port - The port to check
 * @param verbose - Whether to print out error and success messages
 * @returns
 *
 * @throws Error - Some type of custom error used by the `http` module, which extends or simply is an instance of `Error`. Not sure exactly how this is structured, but it generally shouldn't be thrown unless some very unusual error occurs. (Maybe user permissions error, for example `sudo` is needed)
 */
export async function checkNetworkPortAvailable(
  port: number,
  verbose: boolean = true
) {
  const server = http.createServer();

  return new Promise<boolean>((resolve, reject) => {
    server.listen(port, () => {
      if (verbose) {
        console.log(`Port ${port} is available`);
      }
      server.close((err) => {
        if (err) {
          reject(err);
        }
        resolve(true);
      });
    });
    server.on('error', (err) => {
      if (
        (
          err as {
            code?: string;
          }
        ).code === 'EADDRINUSE'
      ) {
        if (verbose) {
          console.log(`Port ${port} is already in use`);
        }
        resolve(false);
      } else {
        reject(err);
      }
    });
  });
}
