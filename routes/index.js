const userRoutes = require('./users');

function initRoutes(app) {
    // déclaration des routes par métiers.
    app.use('/user', userRoutes)

    app.get('/', (req, res, next) => {
        //middleware
        console.log('middleware 1 homepage')
        next()
    }, (req, res, next) => {
        //controller
        console.log('Controller homepage')
        res.status(200).json({
            message: "Bienvenu sur la route d'accueil"
        })
    })
}

module.exports = initRoutes