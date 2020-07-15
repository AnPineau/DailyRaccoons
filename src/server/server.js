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
const uri = process.env.MONGO_URI;
/* const db = require('monk')(uri).then(() => {
    console.log('connected to db');
}).catch(err => console.log(err)); */
const monk = require('monk');
const db = monk(uri);
const images = db.get('images');

app.use(helmet());
app.use(volleyball);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/images', async (req, res) => {
    try {
        const imgs = await images.find();
        return res.send(imgs);
    } catch(err) {
        return res.send(err);
    }
    
});

app.post('/upload', async (req, res) => {
    if (!req.body.images) return res.status(418).send('body null');
    const urls = req.body.images;
    const promises = [];
    try {
        urls.forEach(url => {
            promises.push(images.insert({ url: url }));
        });
        Promise.all(promises).then((result) => {
            images.find().then((result) => {
                res.send(result);
            });
        }).catch(err => console.log(err)).then(() => {
            db.close();
        });
    } catch(err) {
        console.log(err);
    }
});

app.delete('/images', async(req, res) => {
    if (!req.body.images) return res.status(404).send('body.images null');
    let toDelete = req.body.images;
    const promises = [];
    toDelete.forEach(item => {
        promises.push(images.remove(item));
    });
    Promise.all(promises).then((prom) => {
        return res.send('deleted');
    }).catch(err => console.log(err));
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


if (process.env.NODE_ENV === 'production') {
    app.use(express.static(__dirname + '/public/'));
    app.get(/.*/, (req, res) => res.sendFile(__dirname + '/public/index.html'));
}


const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log('Server started on port '+port);
})
