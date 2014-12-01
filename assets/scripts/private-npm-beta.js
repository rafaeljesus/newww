module.exports = function() {
  console.log("I am happening")
  $(function() {
    console.log("I, too, am happening")
    hbspt.forms.create({
      portalId: '419727',
      formId: 'd9ba17d5-606e-456d-a703-733c67f5e708',
      target: '#private-module-signup-form'
    })
  })
}