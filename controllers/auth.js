const passport = require('passport')
const validator = require('validator')
const User = require('../models/User')
const async = require('async')
const crypto = require('node:crypto')
const nodemailer = require('nodemailer')

exports.getLogin = (req, res) => {
  if (req.user) {
    return res.redirect('/folders')
  }
  res.render('login', {
    title: 'Login'
  })
}

exports.postLogin = (req, res, next) => {
  const validationErrors = []
  if (!validator.isEmail(req.body.email)) validationErrors.push({ msg: 'Please enter a valid email address.' })
  if (validator.isEmpty(req.body.password)) validationErrors.push({ msg: 'Password cannot be blank.' })

  if (validationErrors.length) {
    req.flash('errors', validationErrors)
    return res.redirect('/login')
  }
  req.body.email = validator.normalizeEmail(req.body.email, { gmail_remove_dots: false })

  passport.authenticate('local', (err, user, info) => {
    if (err) { return next(err) }
    if (!user) {
      req.flash('errors', info)
      return res.redirect('/login')
    }
    req.logIn(user, (err) => {
      if (err) { return next(err) }
      req.flash('success', { msg: 'Success! You are logged in.' })
      res.redirect(req.session.returnTo || '/folders')
    })
  })(req, res, next)
}

exports.logout = (req, res) => {
  req.logout(() => {
    console.log('User has logged out.')
  })
  req.session.destroy((err) => {
    if (err) console.log('Error : Failed to destroy the session during logout.', err)
    req.user = null
    res.redirect('/')
  })
}

exports.getSignup = (req, res) => {
  if (req.user) {
    return res.redirect('/folders')
  }
  res.render('signup', {
    title: 'Create Account'
  })
}

exports.postSignup = (req, res, next) => {
  const validationErrors = []
  if (!validator.isEmail(req.body.email)) validationErrors.push({ msg: 'Please enter a valid email address.' })
  if (!validator.isLength(req.body.password, { min: 8 })) validationErrors.push({ msg: 'Password must be at least 8 characters long' })
  if (req.body.password !== req.body.confirmPassword) validationErrors.push({ msg: 'Passwords do not match' })

  if (validationErrors.length) {
    req.flash('errors', validationErrors)
    return res.redirect('../signup')
  }
  req.body.email = validator.normalizeEmail(req.body.email, { gmail_remove_dots: false })

  const user = new User({
    userName: req.body.userName,
    email: req.body.email,
    password: req.body.password
  })

  User.findOne({
    $or: [
      { email: req.body.email },
      { userName: req.body.userName }
    ]
  }, (err, existingUser) => {
    if (err) { return next(err) }
    if (existingUser) {
      req.flash('errors', { msg: 'Account with that email address or username already exists.' })
      return res.redirect('../signup')
    }
    user.save((err) => {
      if (err) { return next(err) }
      req.logIn(user, (err) => {
        if (err) {
          return next(err)
        }
        res.redirect('/folders')
      })
    })
  })
}

exports.getPasswordForgot = (req, res, next) => {

  res.render('passwordforgot', {
    user: req.user
  })
}

exports.postPasswordForgot = (req, res, next) => {
  async.waterfall([
    function (done) {
      crypto.randomBytes(20, function (err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function (token, done) {
      User.findOne({ email: req.body.email }, function (err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function (err) {
          done(err, token, user);
        });
      });
    },
    function (token, user, done) {

      // actual transport
      // var smtpTransport = nodemailer.createTransport({
      //   host: 'string',
      //   auth: {
      //     user: process.env.SENDGRID_USER,
      //     pass: process.env.SENDGRID_PASS,
      //   }
      // });


      // testing transport
      const smtpTransport = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: 'jaunita.ryan17@ethereal.email',
          pass: 'gdYak7t3kH7fDhXbme'
        }
      });

      let message = {
        to: user.email,
        from: 'reset@followfolders.com',
        subject: 'Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n',

        html: '<p>You are receiving this because you (or someone else) have requested the reset of the password for your account.<br><br></p>' +
        '<p>Please click on the following link, or paste this into your browser to complete the process:<br><br></p>' +
        `<a href="http://${req.headers.host}/reset/${token}">http://${req.headers.host}/reset/${token}</a>` +

        '<p>If you did not request this, please ignore this email and your password will remain unchanged.</p>'
      };
      smtpTransport.sendMail(message, function (err) {
        req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function (err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
}



exports.getPasswordReset = (req, res, next) => {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {
      user: req.user
    });
  });
};


exports.postPasswordReset = (req, res, next) => {

}


// used for testing email
// const transporter = nodemailer.createTransport({
//   host: 'smtp.ethereal.email',
//   port: 587,
//   auth: {
//       user: 'jaunita.ryan17@ethereal.email',
//       pass: 'gdYak7t3kH7fDhXbme'
//   }
// });