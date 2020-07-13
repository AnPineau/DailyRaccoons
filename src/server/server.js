const express = require('express');
const helmet = require('helmet');
const volleyball = require('volleyball');
const path = require('path');
const fs = require('fs');
const aws = require('aws-sdk');

const app = express();

if (process.env.NODE_ENV !== 'production') {
    const cors = require('cors');
    app.use(cors());
    require('dotenv').config();
}

aws.config.update({
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    accessKeyId: process.env.AWS_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const s3 = new aws.S3();

app.use(helmet());
app.use(volleyball);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Routes

app.get('/', (req, res) => {
    return res.send('youpi ça marche 💪');
});

app.get('/images', async (req, res) => {
    fs.readFile('store.json', 'utf-8', (err, data) => {
        if (err) return res.status(404).send(err);
        if (!data) return res.send([]);
        const images = JSON.parse(data);
        return res.send(images);
    });
});

app.post('/upload', async (req, res) => {
    if (!req.body.images) return res.status(418).send('names null');
    fs.readFile('store.json', 'utf-8', (err, data) => {
        if (err) return res.send(err);
        console.log('data V');
        console.log(data);
        console.log(JSON.parse(JSON.stringify(data)));
        
        let images = [];
        if (data) images = JSON.parse(data);
            
        const newImages = req.body.images;
        console.log(images);
        console.log(newImages);
        const allImages = images.concat(newImages);
        fs.writeFile('store.json', JSON.stringify(allImages), (err) => {
            if (err) console.log(err);
        });
        return res.send(allImages);
    });
});

app.get('/sign-s3', async(req, res) => {
    const S3_BUCKET = process.env.S3_BUCKET;
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
