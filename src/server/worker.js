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
const uri = process.env.MONGO_URI;
const db = require('monk')(uri);
const images = db.get('images');

const client = new Twitter({
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token_key: process.env.ACCESS_TOKEN_KEY,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
})

async function getObject(objectKey) {
    console.log(objectKey);
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

// Lit les images dans la database
images.find().then(async(result) => {

    if (result.length === 0) {
        db.close();
        throw new Error('No files stored in database');
    }

    const urls = [];
    result.forEach(item => {
        urls.push(item.url);
    });

    // Prend une image aléatoire
    const image = urls[Math.floor(Math.random() * urls.length)];
    console.log(image);

    // Garde la key de l'object (filename)
    const image_key = image.split('\\').pop().split('/').pop();

    try {
        // Get l'image depuis le bucket amazon
        console.log('url: ' + image_key);
        const file = await getObject(image_key);

        // Tweet cette image
        client.post('media/upload', {media: file}, function(err, media, res) {
            if(!err) {
                /* console.log(media); */
                const status = {
                    media_ids: media.media_id_string
                };

                client.post('statuses/update', status, function(err, tweet, res) {
                    if(!err) {

                        console.log(image + ' tweeted');

                        // Si succès delete l'image du bucket amazon
                        const toDelete = urls.filter(url => url === image);
                        const params = {
                            Key: image_key,
                            Bucket: process.env.S3_BUCKET
                        };
                        s3.deleteObject(params, (err, data) => {
                            if(err) console.log(err, err.stack);
                            else console.log(image_key + ' removed from bucket');
                        });

                        // Si succès delete l'image de la database
                        images.remove({ url : image }).then(() => {
                            console.log(toDelete + ' removed from database');
                            db.close();
                        }).catch(err => console.log(err));

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

    /* process.exit(); */

}).catch(err => {
    console.log(err);
});

