(function() {
  function log (msg, cls) {
    $('<li class="' + (cls || 'info') + '">' + msg + '</li>').appendTo('#log')
  }
  function errorCallback(err) {
    log(err.message || err.responseText || err.statusText || err || 'error')
  }

  var application = window.APPLICATION
  if (!application) {
    log('Failed to read APPLICATION. You probably did not access this application through a data-fair configuration.', 'error');
    return
  }
  log('Read APPLICATION: ' + JSON.stringify(application));
  if (!application.configuration || !application.configuration.datasets || !application.configuration.datasets[0]) {
    log('The configuration it not sufficient to display some data.', 'error');
    return
  }

  log('Read localization cookie ' + document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('i18n_lang')))

  $.ajax({url: application.configuration.datasets[0].href + '/lines?size=0', json: true})
    .then(function(data) {
      log('Consumed the API of the configured dataset: ' + JSON.stringify(data))
    })

  $('#error-trigger').on('click', function() {
    $.ajax({
      method: 'POST',
      url: application.href + '/error',
      dataType: 'json',
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify({'message': 'This error was triggered by the application. In draft mode it is used to provide feedback to the user, in production it is used to diagnose broken configurations.'})
    }).then(function(data) {
      log('Sent error to application')
    })
  })

  $('#set-config-trigger').on('click', function() {
    window.parent.postMessage({ type: 'set-config', content: {
      field: 'field1',
      value: (application.configuration.field1 || 'patched field value') + '+'
    } }, '*')
  })

  // preparing a slightly different rendering for screenshot might be a good idea
  var thumbnail = (new URL(window.location.href)).searchParams.get('thumbnail') === 'true'
  if (thumbnail) {
    $('#actions-title').remove()
    $('#error-trigger').remove()
    $('#set-config-trigger').remove()
    $('#log-title').remove()
    $('#log').remove()
  }

  // check that we are in a screenshot capture context
  if (window.triggerCapture) {
    // declare that the application is ready to be captured, meaning that the whole page should be rendered by this point
    // the true parameter signifies that this application supports animated screenshots
    var animate = window.triggerCapture(true)
    // animate will be true if the capture context requires an animated rendering
    if (animate) {
      var i = 0
      // prepare the rendering of the next animation frame (based on a 15 frames per second rate)
      window.animateCaptureFrame = function () {
        i++
        $('#animation').text('Animation mode : frame ' + i)
        // stop after 30 frames (2s animation)
        if (i === 30) return true
      }
    }
  }

  const socket = new WebSocket(application.wsUrl)
  socket.addEventListener('open', function (event) {
    const channel = `datasets/${application.configuration.datasets[0].id}/journal`
    log('websocket opened, subscribe to dataset channel : ' + channel)
    socket.send(JSON.stringify({type: 'subscribe', channel}))
  })
  socket.addEventListener('message', function (event) {
    log('websocket received a message : ' + event.data)
  })
})();
