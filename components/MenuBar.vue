<template>
  <div class="menu">
    <div>
    Chi Check
    </div>
    <div>
      <a href="/logout">Logout</a>
    </div>
  </div>
</template>
<script>
export default {
  name: 'MenuBar'
}
</script>
<style scoped lang="sass">
.menu
  display: flex
  justify-content: space-around
  padding-top: 10px
  padding-bottom: 20px
  border-bottom: 1px solid black
a
  text-decoration: none
  color: black
  border: 1px solid black
  padding: 5px
  border-radius: 5px
</style>
