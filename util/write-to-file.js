const fs = require("fs");
const path = require("path");

module.exports = (data) => {
  console.log("the data to write to log file:", data);
  try {
    const now = new Date();
    const timestamp = now.toISOString().replace(/T/, ' ').replace(/\..+/, '');
    const logFilePath = path.join(__dirname, '..', 'logs', `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}.txt`);
    const logMessage = `[${timestamp}] ${data}\n`;
    fs.appendFileSync(logFilePath, logMessage, 'utf-8');
  } catch (err) {
    console.log(err);
  }
};
