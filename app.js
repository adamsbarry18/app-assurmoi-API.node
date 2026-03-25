const express = require('express')
const app = express();
require('dotenv').config()
const cors = require('cors')
const initRoutes = require('./routes');

const PORT = process.env.PORT || 3000
app.use(express.json());
app.use(cors({
    credentials: true,
    origin: [ 'http://example.com', '*' ] //whitelist of domains
}))

initRoutes(app);

app.listen(PORT, () => {
    console.log('server running on port ', PORT)
})

module.exports = app;
