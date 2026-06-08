// mobile-player.js - collapse to playlist-only on scroll for small screens
(function(){
  if(!('addEventListener' in window)) return;
  var last = 0, ticking=false;
  function onScroll(){
    if(window.innerWidth > 720) return;
    var y = window.scrollY || window.pageYOffset;
    if(y > 120 && !document.body.classList.contains('playlist-only')){
      document.body.classList.add('playlist-only');
    } else if (y <= 120 && document.body.classList.contains('playlist-only')){
      document.body.classList.remove('playlist-only');
    }
  }
  window.addEventListener('scroll', onScroll, {passive:true});
})();
