const Path = require('path');
const { exec } = require('child_process');

const request = require('request');
const fs = require('fs');

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

/*

pi@raspberrypi:~/Downloads $ gphoto2 --capture-image-and-download --keep --quiet --filename /home/pi/Downloads/Photo/%:
*** Erreur (-52 : « Impossible de trouver l'appareil demandé sur le port USB ») ***

Pour obtenir les messages de débogage, veuillez utiliser l'option --debug.
Ces messages peuvent aider à trouver une solution au problème. Si vous avez
l'intention d'envoyer un message d'erreur ou de débogage à la liste de
diffusion des développeurs de gPhoto <gphoto-devel@lists.sourceforge.net>,
en anglais, veuillez exécuter gphoto2 comme suit :

    env LANG=C gphoto2 --debug --debug-logfile=my-logfile.txt --capture-image-and-download --keep --quiet --filename /home/pi/Downloads/Photo/%:

Veuillez vous assurer que les arguments sont suffisamment protégés.

pi@raspberrypi:~/Downloads $ gphoto2 --capture-image-and-download --keep --quiet --filename /home/pi/Downloads/Photo/%:
/store_00010001/DSCN0167.JPG
pi@raspberrypi:~/Downloads $ gphoto2 --capture-image-and-download --keep --quiet --filename /home/pi/Downloads/Photo/%:

*** Erreur ***
PTP I/O error
Erreur : Acquisition d'image impossible.
Erreur : Acquisition impossible.

*/

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

const captureImage = (path = '.', callback) => {
  // Uniformization and normalize path.
  path = Path.normalize(Path.format(Path.parse(path)));

  let filename = getFilename();
  let filepath = path + '/' + filename;

  exec('gphoto2 --capture-image-and-download --keep --quiet --filename '+ path +'/%f.%C', (error, stdout, stderr) => {
    if (error) {
      let errorMessage = parseError(error.message);
      console.error(errorMessage);
      return;
    }

    let photoFilename = Path.basename(stdout)
    console.log(`filename: ${photoFilename}`);

    callback(null, photoFilename);
  });

/*
  request('https://unsplash.it/640/480/?random&blur&' + new Date().getTime())
    .pipe(fs.createWriteStream(filepath))
    .on('error', function(err) {
      callback(err, null);
    })
    .on('close', function() {
      callback(null, filename);
    });
*/
};

module.exports = captureImage;
