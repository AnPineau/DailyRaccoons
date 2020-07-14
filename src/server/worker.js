const fs = require('fs');
const Twitter = require('twitter');
const aws = require('aws-sdk');

if (process.env.NODE_ENV !== 'production')
    require('dotenv').config();

aws.config.update({
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    accessKeyId: process.env.AWS_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const s3 = new aws.S3();

const client = new Twitter({
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token_key: process.env.ACCESS_TOKEN_KEY,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
})

async function getObject(objectKey) {
    try {
        const params = {
            Bucket: process.env.S3_BUCKET,
            Key: objectKey
        };
        const data = await s3.getObject(params).promise();
        /* return data.Body.toString('utf-8'); */
        return data.Body;
    } catch(err) {
        throw new Error('Could not retrieve file from s3: '+err.message);
    }
}

// Lit les noms d'images dans store.json
let images = null;
fs.readFile('store.json', 'utf-8', async (err, data) => {
    images = JSON.parse(data);
    /* console.log(data); */

    if (images.length === 0) throw new Error('No image available');

    // Prend une image aléatoire
    const image = images[Math.floor(Math.random() * images.length)];
    console.log(image);

    // TODO: Get image from amazon S3 bucket
    const image_key = image.split('\\').pop().split('/').pop();
    
    try {
        console.log('url: ' + image_key);
        const file = await getObject(image_key);
        /* console.log(file); */
        // Tweet cette image
        client.post('media/upload', {media: file}, function(err, media, res) {
            if(!err) {
                /* console.log(media); */
                const status = {
                    media_ids: media.media_id_string
                };

                client.post('statuses/update', status, function(err, tweet, res) {
                    if(!err) {
                        /* console.log(tweet); */
                        console.log(image + ' tweeted');
                        // Si succès delete l'image
                        const newImages = images.filter(item => item !== image);
                        /* console.log(newImages); */
                        fs.writeFile('store.json', JSON.stringify(newImages), (err) => {
                            if (err) console.log(err);
                            console.log(image + ' deleted');
                        });
                    } else {
                        console.log(err);
                    }
                });
            } else {
                console.log(err);
            }
        });
    } catch(err) {
        console.log(err);
    }
    

});
