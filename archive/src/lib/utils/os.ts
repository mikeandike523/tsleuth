import { spawn } from 'child_process';

export function openUrlInWebBrowser(url: string) {
  const isWindows = process.platform === 'win32';
  const isLinux = process.platform === 'linux';

  if (isWindows) {
    // On Windows, use the 'start' command
    spawn('start', [url], { shell: true });
  } else if (isLinux) {
    // On Linux, use the 'xdg-open' command
    spawn('xdg-open', [url]);
  } else {
    // For other platforms, you can add more cases as needed
    console.log('Unsupported platform. Please open the URL manually:', url);
  }
}
