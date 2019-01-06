var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var pdfFillForm = require('pdf-fill-form');
var fs = require('fs');
const bodyParser = require('body-parser');
const aws = require('aws-sdk');

var app = express();

aws.config.update({
  region: 'us-east-2' // region of your bucket
});

const s3 = new aws.S3();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));

/*
var pdfFields = pdfFillForm.readSync('test.pdf');
console.log(pdfFields);

*/

app.post('/generate', function (req, res) {
  let randFileName = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5) + ".pdf";
  pdfFillForm.writeAsync('voterFormMiddlesex.pdf', req.body, { "save": "pdf" }, 
    function(err, pdf) {
        fs.writeFile(randFileName, pdf, function(err){});
    }
  );
  setTimeout(function() {
    location = "weird";
    fs.readFile(randFileName, (err, data) => {
      if (err) throw err;
      const params = {
          Bucket: 'generated-forms0598', // pass your bucket name
          Key: randFileName, 
          Body: JSON.stringify(data, null, 2)
      };
      s3UploadPromise = new Promise(function(resolve, reject) {
        s3.upload(params, function(s3Err, data) {
          if (s3Err) throw s3Err;
          location = data.Location;
          resolve();
        });
      });
      s3UploadPromise.then(function(){fs.unlinkSync(randFileName);res.send(location);});
    });
  }, 2000);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;