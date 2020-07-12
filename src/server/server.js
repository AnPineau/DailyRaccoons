const express = require('express');
const helmet = require('helmet');
const volleyball = require('volleyball');
const path = require('path');
const fs = require('fs');
const aws = require('aws-sdk');

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
    fs.readFile('store.json', (err, data) => {
        if (err) return res.status(404).send(err);
        const images = JSON.parse(data);
        return res.send(images);
    });
});

app.get('/upload', async(req, res) => {
    return res.send('ici upload oui');
});

app.get('/sign-key', async(req, res) => {
    const S3_BUCKET = process.env.S3_BUCKET;
    const s3 = new aws.S3();
    const fileName = req.query['file-name'];
    const fileType = req.query['file-type'];
    const s3Params = {
        Bucket: S3_BUCKET,
        Key: fileName,
        Expires: 60,
        ContentType: fileType,
        ACL: 'public-read'
    };
    s3.getSignedUrl('putObject', s3Params, (err, data) => {
        if (err) {
            console.log(err);
            return res.end();
        }
        const returnData = {
            signedRequest: data,
            url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`
        };
        res.write(JSON.stringify(returnData));
        res.end();
    });
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
