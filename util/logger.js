const fs = require('fs');

module.exports = (data) => {
  try {
    const now = new Date();
    const timestamp = now.toISOString().replace(/T/, ' ').replace(/\..+/, '');
    const logFilePath = './util/cache/logs.txt';
    const logMessage = `[${timestamp}] ${data}\n`;

    fs.appendFileSync(logFilePath, logMessage, 'utf-8');

    console.log('Content appended to the file successfully.');
  } catch (err) {
    console.error('An error occurred while appending to the file:', err);
  }
};
