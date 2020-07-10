const fs = require('fs');
require('dotenv').config();
const Twitter = require('twitter');

const client = new Twitter({
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token_key: process.env.ACCESS_TOKEN_KEY,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
})

const assets = '../../assets/';

// Récupère le dossier ../../assets
const images = fs.readdirSync(assets);
console.log(images);

let images = null;
fs.readFile('store.json', (err, data) => {
    images = JSON.parse(data);
    console.log(data);
});

// Prend une image aléatoire
const image = images[Math.floor(Math.random() * images.length)];
console.log(image);

// TODO: Get image from amazon S3 bucket

// Tweet cette image
client.post('media/upload', {media: image}, function(err, media, res) {
    if(!err) {
        /* console.log(media); */
        const status = {
            media_ids: media.media_id_string
        };

        client.post('statuses/update', status, function(err, tweet, res) {
            if(!err) {
                /* console.log(tweet); */
                // Si succès delete l'image
                const newImages = images.filter(item => item !== image);
                console.log(newImages);
                fs.writeFile('store.json', JSON.stringify(newImages), (err) => {
                    if (err) console.log(err);
                    console.log('successfully written');
                });
            }
        });
    }
});
