const express = require('express');
const helmet = require('helmet');
const volleyball = require('volleyball');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(helmet());
app.use(volleyball);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


if (process.env.NODE_ENV !== 'production') {
    const cors = require('cors');
    app.use(cors());
    require('dotenv').config();
}


// Routes

app.get('/', (req, res) => {
    return res.send('youpi ça marche 💪');
});

app.get('/images', (req, res) => {
    const images = fs.readdirSync('../../assets');
    res.send(images);
});

app.get('/upload', async(req, res) => {
    return res.send('ici upload oui');
});

app.use('/assets', express.static(path.join(__dirname + '../../../assets')));

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(__dirname + '/dist'));
    app.get(/.*/, (req, res) => res.sendFile(__dirname + '../../../dist/index.html'));
}


const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log('Server started on port '+port);
})
