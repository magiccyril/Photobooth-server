const Path = require('path');
const { exec } = require('child_process');

const noSleep = () => {
  exec('gphoto2 --summary', (error, stdout, stderr) => {
    console.log('No Sleep')
  });
};

module.exports = noSleep;
