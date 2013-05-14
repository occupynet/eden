var gSession;

function mexcla_toggle_call_status() {
  if(gSession) { 
    mexcla_hangup();
  } else {
    // Seems to fail without a page reload
    // and since we have onLoad property set
    // to dial, that's all we need.
    location.reload();
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
  change_submit_button_value('Connect');
}

function mexcla_init() {
  // Initialize the engine
  SIPml.init(
    function(e){
      sipStack =  new SIPml.Stack({
        realm: config.realm, 
        impi: config.impi, 
        impu: config.impu, 
        password: config.password, 
        enable_rtcweb_breaker: config.enable_rtcweb_breaker,
        events_listener: { 
          events: 'started', 
          listener: function(e){
            var callSession = sipStack.newSession(
              'call-audio', 
              { audio_remote: 
                document.getElementById('audio-remote')
              }
            );
            callSession.call('9999');
            // Save session in global variable
            // so we can call the dtmf method
            // throughout the call
            gSession = callSession;
          }  
        }
      });
      sipStack.start();
      change_submit_button_value('Disconnect');
      // Initialize radio buttons
      mexcla_check_radio_button('mic-unmute');
      mexcla_check_radio_button('mode-original');
    }
  );
}
 
function mexcla_dtmf(key) {
  if(gSession) {
    gSession.dtmf(key);
    return true;
  } else { 
    alert("Your call is not yet connected.");
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
