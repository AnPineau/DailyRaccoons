<template>
  <div class="root">

    <Home />

  </div>
</template>

<script>
import Home from './components/Home.vue'

export default {
  name: 'App',
  components: {
    Home
  }
}
</script>

<style>

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;

  font-family: Nunito;

  --color-important: #4fc08d;
  --color-important-hover: #37a774;
  --color-basic: rgb(252, 252, 252);

}
a:hover, a:visited, a:focus {
  text-decoration: none;
  color: inherit;
}

</style>
