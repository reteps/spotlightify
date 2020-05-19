<template>
  <div class='help'>
    <v-dialog v-model="dialog">
      <template v-slot:activator="{ on }">
        <v-btn color="red lighten-2 mt-2" dark v-on="on">
          Help <v-icon>fa-question</v-icon>
        </v-btn>
      </template>

      <v-card>
        <v-card-title class="headline grey lighten-2" primary-title> Understanding playlist overlap </v-card-title>

        <v-img src="/explanation.png"></v-img>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="dialog = false"> Close </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
  export default {
    data () {
      return {
        dialog: false
      }
    }
  }
</script>
<style lang='sass'>
  .v-dialog
    width: 90%
  @media (min-width: 800px)
    .v-dialog
      width: 50%
</style>
