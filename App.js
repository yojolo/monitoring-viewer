var express = require('express');
var compression = require('compression');
var fs = require('fs');
var async = require("async");

var app = express();

// Configuration
var config = {
    inputDirectory: 'samples/',
    cacheDirectory: 'cache/'
};

// Middlewares 
app.use(compression());
app.use(express.static('public'));
app.use(logErrors);
app.use(clientErrorHandler);
app.use(errorHandler);

function logErrors(err, req, res, next) {
  console.error(err.stack);
  next(err);
}
function clientErrorHandler(err, req, res, next) {
  if (req.xhr) {
    res.status(500).send({ error: 'Something failed!' });
  } else {
    next(err);
  }
}
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  res.status(500);
  res.render('error', { error: err });
}


// Actions
app.get('/methodsPerformance.json', function (req, res) {

    parseJsonFiles(config.inputDirectory, onComplete, throwError);

    function onComplete(data) {
        async.forEachOf(data, generateCacheFile);

        res.send(data);
    }
    
});

app.listen(3000, function () {
    console.log('Monitoring Viewer API listening on port 3000!');
});


function generateCacheFile(inputValues, filename)
{
    console.log(filename);
    console.log(inputValues);
}

function throwError(error) {
    throw error;
}

function parseJsonFiles(dirname, onComplete, onError) {
    fs.readdir(dirname, function (err, filenames) {
        if (err) {
            onError(err);
            return;
        }

        var data = {};
        async.each(filenames, function (filename, callback) {

            fs.readFile(dirname + filename, 'utf-8', function (err, content) {
                if (err) {
                    callback(err);
                    return;
                }

                data[filename] = parseJson(content);
                callback();
            });

        }, 
        function (err)
        {
            if (err) {
                onError(err);
            }
            onComplete(data);
        });
    });
}

function parseJson(content) {

    var lastChar = content.substr(content.length - 1);
    if (lastChar === ',') {
        content = '[' + content.substring(0, content.length - 1) + ']';
    }
    return JSON.parse(content);
}