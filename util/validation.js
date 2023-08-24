const { check } = require('express-validator');

exports.loginValidation = [
    check('email', 'invalid-email').isEmail().normalizeEmail({ gmail_remove_dots: true }),
    check('password', 'wrong-password-min-6').isLength({ min: 6 })
]

