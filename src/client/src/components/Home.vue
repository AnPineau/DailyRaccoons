<template>
  <div class="root">

    <h1 class="title">Crewbot ⚓</h1>

    <h2 class="bot-title">Daily Raccoons</h2>

    <div class="twitter">
      <a class="twitter-timeline" data-height="300" data-theme="light" href="https://twitter.com/DaiIyRaccoons?ref_src=twsrc%5Etfw">Tweets by DaiIyRaccoons</a>
    </div>
    

    <h2 class="upload-title">Upload pictures of raccoon</h2>

    <vueDropzone ref="dropzone" id="dropzone" :options="dropzoneOptions" :useCustomSlot="true" >
      <div class="dropzone-content">
        <h3>📥</h3>
        <p>Choose images or drag them here</p>
      </div>
    </vueDropzone>

    <img src="@/assets/loader.gif" v-if="uploading" class="status-logo" />
    <img src="@/assets/completed.png" v-if="completed" class="status-logo" />
    <p class="error" v-if="error">{{ error }}</p>


    <button class="submit" @click="uploadImages">Upload</button>

    <h2 class="gallery-title">Waiting list</h2>
    <div v-if="loaded" class="gallery">
      <div class="image" v-for="(image, index) in images" :item="image" :index="index" :key="index">
        <img :src="image" />
      </div>
    </div>

  </div>
</template>

<script>
import vueDropzone from "vue2-dropzone";
import "vue2-dropzone/dist/vue2Dropzone.min.css";
import axios from "axios";

export default {
  name: "Home",
  components: {
    vueDropzone
  },
  data() {
    return {
      backend_url: 'https://daily-raccoons.herokuapp.com/',
      images: [],
      loaded: false,
      uploading: false,
      completed: false,
      error: '',
      dropzoneOptions: {
        url: "#",
        autoProcessQueue: false,
        thumbnailWidth: 150,
        uploadMultiple: true,
        parallelUploads: 1,
        addRemoveLinks: true,
        thumbnailMethod: 'contain',
        maxFilesize: 5,
        acceptedFiles: '.jpg, .png'

      }
    };
  },
  async created() {
    try {
      const res = await axios.get(this.backend_url + "images");
      this.images = res.data;
      this.loaded = true;
    } catch(err) {
      console.log(err);
    }
    
  },
  methods: {
    async uploadImages() {
      this.error = '';
      this.completed = false;
      const files = this.$refs.dropzone.getAcceptedFiles();
      /* console.log(files); */
      if (files.length === 0) return this.error = 'No files to upload' ;
      this.completed = false;
      this.uploading = true;
      let names = [];
      let promises = [];
      for await (const file of files) {
        try {
          const url = `${this.backend_url}sign-s3?file-name=${file.name}&file-type=${file.type}`;
        
          const res = await axios.get(url);
          // Mettre .then au lieu d'await ici si problemes
          /* console.log(file);
          console.log(res.data.signedRequest); */
          const options = {
            headers: {
              'Content-Type': file.type
            }
          };
          const promise = axios.put(res.data.signedRequest, file, options).then(() => 
            names.push(res.data.url)
          ).catch(err => console.log(err.response));
          promises.push(promise);
        } catch(err) {
          console.log(err.response);
        }
      }
      await Promise.all(promises).then(async() => {
        /* console.log(names); */
        const res = await axios.post(this.backend_url + 'upload', {images: names});
        this.images = res.data;
        /* console.log('res.data V');
        console.log(res.data); */
        this.$refs.dropzone.removeAllFiles();
        this.uploading = false;
        this.completed = true;
      }).catch(err => console.log(err.response));
    }
  }
};
</script>

<style scoped>

.root {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.title {
  margin: 3rem;
  color: var(--color-important); 
  text-shadow: 0px 1px 1px rgba(0,0,0,0.4)
}
.bot-title {
  margin-bottom: 1rem;
}
.twitter {
  border: solid 2px rgba(0, 0, 0, 0.15);
  border-radius: 1rem;
  padding: 1rem;
  margin-bottom: 3rem;
  width: calc(100vw * 0.8);
  max-width:50rem; 
}
#dropzone {
  border: dashed 2px rgba(0, 0, 0, 0.3);
  border-radius: 1rem;
  margin: 1rem;
  width: calc(100vw * 0.8);
  max-width: 50rem; 
}
.dropzone-normal {
  height: inherit;
}
.dropzone-big {
  height: 90vh;
}
.status-logo {
  height: 5rem;
}
.error {
  height: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: red;
  margin-bottom: 1rem;
}
.submit {
  width: 7rem;
  height: 2rem;
  text-transform: uppercase;
  font-weight: bold;
  font-size: 1rem;
  border-radius: 0.5rem;
  border: none;
  background-color: var(--color-important);
  color: var(--color-basic);
}
.submit:hover {
  background-color: var(--color-important-hover);
  cursor: pointer;
}
.gallery-title {
  margin: 1rem;
  margin-top: 3rem;
}
.gallery {
  display: flex;
  flex-flow: row wrap;
  border: solid 2px rgba(0, 0, 0, 0.15);
  border-radius: 1rem;
  padding: 2rem;
  width: calc(100vw * 0.8);
  max-width: calc(100rem); 
  margin-bottom: 3rem;
}
.image {
  width: 18%;
  height: calc(100vw * 0.8 * 0.15);
  margin-left: 1%;
  margin-right: 1%;
  margin-bottom: 2%;
}
.image img {
  overflow: hidden;
  object-fit: cover;
  width: 100%;
  height: 100%;
}

</style>
