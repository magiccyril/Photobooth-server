const fs = require('fs');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const cors = require('cors');
const captureImage = require('./commands/capture-image');

// Try to wake up the camera every 10 minutes.
const noSleep = setInterval(require('./commands/nosleep'), 600000);

var logger = io.of('/logger');

app.use(cors());

const THUMB_PREFIX = 'thumb_';
const PHOTDIR = 'photos';
app.use('/' + PHOTDIR, express.static(__dirname + '/' + PHOTDIR));

const PATH_API_PHOTOS = '/api/photos';

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/html/index.html');
});

app.get(PATH_API_PHOTOS, (req, res) => {
  let files = fs.readdirSync(__dirname + '/' + PHOTDIR);
  
  let absolute = (req.query.absolute == 'true' || req.query.absolute == '1') ? true : false;

  res.json(files
    .filter(file => file[0] != '.')
    .filter(file => file.substring(0, THUMB_PREFIX.length) === THUMB_PREFIX)
    .map(file => {
      let path = absolute ? req.protocol + '://' + req.hostname + '/' : '';
      let fullFile = file.substring(THUMB_PREFIX.length);
      
      return {
        full: path + PHOTDIR + '/' + fullFile,
        thumb: path + PHOTDIR + '/' + file,
      }
    }));
});

const log = (string, socket) => {
  console.log('[' + new Date().toJSON() + '] [' + socket.id + '] ' + string);
  logger.emit('log', {
    log: string,
    date: new Date().toJSON(),
    id: socket.id,
  });
};

logger.on('connection', (socket) => {
  log('logger connection', socket);
});

io.on('connection', socket => {
  log('client connection', socket);
  
  socket.on('error', (error) => {
    log('client error : ' + error.toString(), socket);
  });
  socket.on('disconnecting', (reason) => {
    log('client disconnecting, reason : ' + reason, socket);
  });
  socket.on('disconnect', (reason) => {
    log('client disconnect, reason : ' + reason, socket);
  });
  
  socket.on('PHOTO_REQUEST', function (data) {
    log('photo request', socket);

    socket.emit('PHOTO_REQUEST_RECEIVED');
    
    let processingTimeout;

    captureImage(__dirname + '/photos/', THUMB_PREFIX, function(err, filename) {
      if (err) {
        socket.emit('PHOTO_REQUEST_ERROR');
      }
      
      clearTimeout(processingTimeout);
      
      socket.emit('PHOTO_REQUEST_RESULT', {
        path: '/' + PHOTDIR + '/' + THUMB_PREFIX + filename
      });
      
      log('result sent', socket);
    });

    processingTimeout = setTimeout(() => {
      socket.emit('PHOTO_REQUEST_PROCESSING');
      log('processing photo', socket);
    }, 1500);
  });
});

http.listen(8080, () => {
  console.log('App listening on port 8080');
});
