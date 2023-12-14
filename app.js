const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const GcpDot = require('./gcprand'); // Assuming GcpDot class is in 'gcprand.js'
const path = require('path');

app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'templates'));

app.get('/', (req, res) => {
    res.render('index', { random_string: '', error_message: null });
});

app.post('/', async (req, res) => {
    let stringLength = 128;
    let errorMessage = null;

    try {
        stringLength = parseInt(req.body.length) || 128;
        if (stringLength < 1 || stringLength > 1000) {
            errorMessage = "Length must be between 1 and 1000.";
            stringLength = 128;
        }
    } catch (e) {
        errorMessage = "Please enter a valid integer for the string length.";
        stringLength = 128;
    }

    let g = new GcpDot("Path to Firefox Driver");
    let seed = await g.random();
    console.log("Seed: " + seed);

    // Generate random string (you might need to implement your own random string generator)
    let randomString = generateRandomString(stringLength); // Implement this function
    res.render('index', { random_string: randomString, error_message: errorMessage });
});

function generateRandomString(length) {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}


app.listen(3000, () => {
    console.log('Server started on port 3000');
});
