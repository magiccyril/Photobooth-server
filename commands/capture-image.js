const Path = require('path');
const { exec } = require('child_process');

const request = require('request');
const fs = require('fs');
const gm = require('gm');

const parseError = (error) => {
  let re = /\*\*\*\sError\s+\((.*):\s+\'(.*)\'\)\s/;
  let match = error.match(re);
  if (match) {
    let code = match[1];
    let message = match[2];
    return message;
  }
  
  return 'Unknown error';
};

const getFilename = () => {
  let date = new Date();
  let dateString = {
    year: ('' + date.getFullYear()).padStart(4, '0'),
    month: ('' + (date.getMonth() + 1)).padStart(2, '0'),
    day: ('' + date.getDate()).padStart(2, '0'),
    hours: ('' + date.getHours()).padStart(2, '0'),
    minutes: ('' + date.getMinutes()).padStart(2, '0'),
    seconds: ('' + date.getSeconds()).padStart(2, '0'),
  }
  
  return dateString.year + dateString.month + dateString.day + '-' + dateString.hours + dateString.minutes + dateString.seconds + '.jpg';
}

const captureImage = (path = '.', thumbprefix = 'thumb_', callback) => {
  // Uniformization and normalize path.
  path = Path.normalize(Path.format(Path.parse(path)));

  let filename = getFilename();
  let filepath = path + '/' + filename;
  let thumbpath = path + '/' + thumbprefix + filename;

  exec('gphoto2 --capture-image-and-download --keep --quiet --filename '+ filepath, (error, stdout, stderr) => {
    if (error) {
      let errorMessage = parseError(error.message);
      console.error(errorMessage);
      return;
    }

    gm(filepath)
      .thumb(640, 480, thumbpath, 80, function(err, stdout, stderr, command) {
        if (err) {
          return callback(err, null);
        }

        callback(null, filename);
      })
  });

/*
  request('https://unsplash.it/1024/768/?random&blur&' + new Date().getTime())
    .pipe(fs.createWriteStream(filepath))
    .on('error', function(err) {
      callback(err, null);
    })
    .on('close', function() {
      gm(filepath)
        .thumb(640, 480, thumbpath, 80, function(err, stdout, stderr, command) {
          if (err) {
            return callback(err, null);
          }

          callback(null, filename);
        })
    });
*/
};

module.exports = captureImage;
