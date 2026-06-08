(function(){
  var mobileFolder = 'mobile EDIT';
  var encodedMobileFolder = encodeURIComponent(mobileFolder);
  var rawPath = location.pathname;
  var decodedPath = decodeURIComponent(rawPath);
  var folderPattern = new RegExp('(?:^|/)' + mobileFolder + '(?:/|$)');
  var inMobileFolder = folderPattern.test(decodedPath);

  var mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  var mobileScreen = window.matchMedia && window.matchMedia('(max-width:720px)').matches && /Mobile/i.test(navigator.userAgent);
  var isMobile = mobileUA || mobileScreen;

  if (inMobileFolder) {
    if (!isMobile) {
      var desktopPath = decodedPath.replace(folderPattern, '/');
      desktopPath = desktopPath.replace(/\/\/{2,}/g, '/');
      if (desktopPath.slice(-1) === '/') desktopPath += 'index.html';
      var target = location.origin + desktopPath;
      try {
        location.replace(target);
      } catch(e) {
        location.href = target;
      }
    }
    return;
  }

  if (isMobile) {
    var file = (rawPath.split('/').pop() || 'index.html');
    var base = rawPath.replace(/[^/]*$/, '');
    var target = location.origin + base + encodedMobileFolder + '/' + file;
    try {
      location.replace(target);
    } catch(e) {
      location.href = target;
    }
  }
})();
