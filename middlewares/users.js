const { checkSchema } = require('express-validator')

async function validateUsername(req, res, next) {
    const [ hasError ] = await checkSchema({
        username: { notEmpty: true }
    }).run(req);

    if(hasError.isEmpty()) {
        return next();
    }
    
    res.status(400).json({
        message: "missing username"
    }).send();
}

module.exports = {
    validateUsername
}