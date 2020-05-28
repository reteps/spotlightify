<template>
  <v-tooltip bottom>
    <template v-slot:activator="scope">
      <v-btn class="black--text" active-class="white--text" :color="color" :value="text.toLowerCase()" v-on="scope.on">{{ text }}</v-btn>
    </template>
    <span>{{ help }}</span>
  </v-tooltip>
</template>
<script>
export default {
  name: 'InfoButton',
  props: ['help','text', 'color']
}
</script>
