var gSession;

function mexcla_toggle_call_status() {
  if(gSession) { 
    mexcla_hangup();
  } else {
    mexcla_call_init();
  }
}

function mexcla_hangup() {
  if(gSession) { 
    gSession.hangup();
    // Unset gSession so when the user tries to re-connect
    // we know to re-connect
    sipStack.stop();
    gSession = null;
  }
  change_submit_button_value(lang_submit_button_connect);
  // Seems to prevent reconnection without a page reload
  location.reload();
}

function mexcla_init() {
  conf = mexcla_get_conference_number();
  console.log("Conference is: " + conf);
  mexcla_init_language_links();
  mexcla_init_iframes();
}

function mexcla_init_language_links() {
  // Update the en and es page links to include the
  // given URL parameters.
  path = window.location.pathname;
  if(-1 != path.indexOf('/en/')) {
    en = path;
    es = path.replace('/en/','/es/');
  }
  else {
    es = path;
    en = path.replace('/es/','/en/');
  }
  document.getElementById('es-switch-link').href = es;
  document.getElementById('en-switch-link').href = en;
}

function mexcla_init_iframes() {
  params = mexcla_get_url_params()
  for (var i = 0; i < params.length; i++) {
    param = params[i];
    if(param.substr(0,3) == 'irc') {
      mexcla_toggle_irc();
    }
    else if(param.substr(0,4) == 'calc') {
      mexcla_toggle_calc();
    }
  }
}

function mexcla_toggle_irc() {
  mexcla_toggle_iframe('irc-frame', 'https://irc.indymedia.nl/?form=off&secure=on&channels=#mayfirst&nick=mfpl-member&cgiirc=mozilla');
}

function mexcla_toggle_pad() {
  // We use mexcla_get_hash so the calc pages created aren't so trivially discovered.
  mexcla_toggle_iframe('pad-frame', 'https://pad.riseup.net/p/' + mexcla_get_hash());
}
function mexcla_toggle_iframe(id,url) {
  if($('#' + id).length == 0) {
    // The element doesn't exist, add it.
    mexcla_add_iframe(id, url);
    $('.draggable').draggable();
  }
  else{
    $('#' + id).remove();
  }
}

function mexcla_toggle_calc() {
  // We use mexcla_get_hash so the calc pages created aren't so trivially discovered.
  mexcla_toggle_iframe('calc-frame', 'https://calc.mayfirst.org/' + mexcla_get_hash());
}

// Generate a random-looking hash that will be the same for everyone on the
// same conference call.
function mexcla_get_hash() {
  s = 'mfpl-mexcla' + mexcla_get_conference_number();
  return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
}

function mexcla_call_init() {
  // Ensure we have a conference number
  conf = mexcla_get_conference_number();
  if(conf == 0) {
    alert("Failed to get the conference number.");
    return false;
  }
  if(conf > 999) {
    alert("Conference numbers must be below 999. Your number is " + conf);
    return false;
  }
  // Initialize the engine
  SIPml.init(
    function(e){
      sipStack =  new SIPml.Stack({
        realm: config.realm, 
        impi: config.impi, 
        impu: config.impu, 
        password: config.password, 
        enable_rtcweb_breaker: config.enable_rtcweb_breaker,
        outbound_proxy_url: config.outbound_proxy_url,
        websocket_proxy_url: config.websocket_proxy_url,
        ice_servers: config.ice_servers,
        events_listener: { 
          events: 'started', 
          listener: function(e){
            // Create a new call
            var callSession = sipStack.newSession(
              'call-audio', 
              { audio_remote: 
                document.getElementById('audio-remote')
              }
            );
            // Define a listener that will alert the user when we are connecting
            // and when we are connected.
            callSession.addEventListener('*', function(se) {
              // alert("Event type is: " + se.type);
              if (se.type == "connecting") {
                change_submit_button_value(lang_connecting);
              } else if(se.type == 'connected') {
                change_submit_button_value(lang_disconnect);
                mexcla_join_conference();
              }
            });
            // Place the call.
            callSession.call('9999');
            
            // Save session in global variable
            // so we can call the dtmf method
            // throughout the call
            gSession = callSession;
          }  
        }
      });
      sipStack.start();
      // Initialize radio buttons
      mexcla_check_radio_button('mic-unmute');
      mexcla_check_radio_button('mode-original');
    }
  );
}
 
function mexcla_get_url_params() {
  // Split the url by /, skipping the first / so we don't have an empty value first.
  parts = window.location.pathname.substr(1).split('/');
  // Delete empty parts
  for (var i = 0; i < parts.length; i++) {
    if(parts[i] == '') {
      delete parts[i];
    }
  }
  return parts;
}

function mexcla_get_conference_number() {
  var params = mexcla_get_url_params();
  // Find the numeric argument. Pick the first one we find
  // and we use that as the conference number.
  // Thanks to http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
  conf = 0;
  for (var i = 0; i < params.length; i++) {
    param = params[i];
    if(!isNaN(parseFloat(param)) && isFinite(param)) {
      conf = param;
      break;
    }
  }
  return conf
}

function mexcla_join_conference() {
  conf = mexcla_get_conference_number();

  if(conf == 0) {
    alert("Failed to capture the conference number. Please try again.");
    return;
  }

  // We have to send the conference number in single digits followed by #.
  digits = conf.split('');
  for (var i = 0; i < digits.length; i++) {
    // If we send the digits too quickly freeswitch can't process
    // them reliably.
    mexcla_pause(200);
    mexcla_dtmf(digits[i]);
  }
  mexcla_pause(200);
  mexcla_dtmf('#');
}

function mexcla_dtmf(key) {
  if(gSession) {
    var ret = gSession.dtmf(key);
    // alert("Sent " + key + " got " + ret);
    return true;
  } else { 
    alert(lang_not_yet_connected);
    return false;
  }
}

function mexcla_check_radio_button(id) {
  document.getElementById(id).checked = true;

}

function change_submit_button_value(val) {
  document.getElementById('connect-button').value = val;
}

function mexcla_mic_mute() {
  if(mexcla_dtmf('*')) {
    mexcla_check_radio_button('mic-mute');
  }
}
function mexcla_mic_unmute() {
  if(mexcla_dtmf('*')) {
    mexcla_check_radio_button('mic-unmute');
  }
}
function mexcla_mode_original() {
  if(mexcla_dtmf('0')) {
    mexcla_check_radio_button('mode-original');
  }
}
function mexcla_mode_hear_interpretation() {
  if(mexcla_dtmf('1')) {
    mexcla_check_radio_button('mode-hear-interpretation');
  }
}
function mexcla_mode_provide_interpretation() {
  if(mexcla_dtmf('2')) {
    mexcla_check_radio_button('mode-provide-interpretation');
  }
}

// Thanks to http://stackoverflow.com/questions/951021/what-do-i-do-if-i-want-a-javascript-version-of-sleep
// I realize this is "wrong" and freezes up the browser, but setTimeout doesn't
// seem to work when called within the sipml context.
function mexcla_pause(s) {
  var date = new Date();
  var curDate = null;
  do { curDate = new Date(); }
  while(curDate - date < s);
}

function mexcla_add_iframe(id, src) {
  $("#user-objects").append('<iframe class="draggable resizable" id="' + id + '" src="' + src + '"/>');
}
