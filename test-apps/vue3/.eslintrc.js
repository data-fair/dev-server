module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    'standard'
  ],
  rules: {
    'vue/multi-word-component-names': 'off'
  }
}
