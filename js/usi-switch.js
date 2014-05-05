var pathname = window.location.pathname;
var usi = pathname.split('/');
var logo = jQuery("#logo");
if(usi[1] == 'usi') {
  logo.attr("src","/mexcla/images/USi-logo.png");
}

