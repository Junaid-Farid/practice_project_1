$(function() {
  mobileNav();
});

function mobileNav() {
  $('.hamburger').on('click', function(){
    var status = $(this).hasClass('is-active');
    if(status){ $('.hamburger').removeClass('is-active'); }
    else { $('.hamburger').addClass('is-active'); }
  });
}
