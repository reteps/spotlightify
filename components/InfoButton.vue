<template>
  <v-tooltip bottom>
    <template v-slot:activator="{ on }">
      <v-btn :color="color" :value="text" v-on="on">{{ text }}</v-btn>
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
