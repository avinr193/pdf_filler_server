var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var pdfFillForm = require('pdf-fill-form');
var fs = require('fs');
const bodyParser = require('body-parser');
var mailer = require('nodemailer');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));


var pdfFields = pdfFillForm.readSync('voterFormMiddlesex.pdf');
//console.log(pdfFields);

app.use(function (req, res, next) {

  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', 'https://ruvoting2019.herokuapp.com');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, Accept, X-Custom-Header');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  if (req.method == "OPTIONS") {
    return res.setStatus(200).end();
  }

  // Pass to next layer of middleware
  return next();
});

let transporter = mailer.createTransport({
  host: 'smtp.gmail.com', 
  port:465,
  secure: true, 
  auth:{
    user: 'ruvotingwizard@gmail.com', 
    pass: '#BOSH7rutgers'
  }
});

app.post('/generate', function (req, res) {
  let randFileName = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5) + ".pdf";
  pdfFillForm.writeAsync('voterFormMiddlesex.pdf', req.body, { "save": "pdf" }, 
    function(err, pdf) {
        if (err) res.status(500).send(err);
        fs.writeFile(randFileName, pdf, function(err){
          if (err) res.status(500).send(err);
        });
    }
  );
  setTimeout(function() {
    fs.readFile(randFileName, (err, data) => {
      if (err) res.status(500).send(err);
      var base64data = new Buffer(data, 'binary');
      transporter.sendMail({       
        sender: 'ruvotingwizard@gmail.com',
        to: 'avinabraham17@gmail.com',
        subject: 'Your Filled-In Voting Form',
        text: 'The filled-out voter registration form is attached for your records. Thank you for using RU Voting Wizard!',
        attachments: [{'filename': randFileName, 'content': base64data}]
    }), function(err, success) {
        if (err) {
            // Handle error
            res.status(500).send(err);
        }
    }
    transporter.sendMail({       
      sender: 'ruvotingwizard@gmail.com',
      to: 'avinabraham17@gmail.com',
      subject: 'New Filled-In Voter Registration Form',
      text: 'Attached for printing.',
      attachments: [{'filename': randFileName, 'content': base64data}]
  }), function(err, success) {
      if (err) {
          // Handle error
          res.status(500).send(err);
      }
  }
  fs.unlinkSync(randFileName);
  res.status(200).send('success');
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
