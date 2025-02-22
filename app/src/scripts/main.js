function getCookie(name) {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === name) return decodeURIComponent(value);
  }
  
  return null;
}

function award() {
  const isLogged = getCookie('logged') !== null;
  const currentUrl = window.location.pathname;

  if (currentUrl.startsWith('/desk/')) {
    !isLogged && (window.location.href = '/auth/login');
  } else if (currentUrl.startsWith('/auth/')) {
    isLogged && (window.location.href = '/desk/Desk View/view');
  }
}

window.addEventListener('popstate', function (e) {
  e.stopPropagation();
  award();
});

window.addEventListener('pageshow', function (e) {
  e.stopPropagation();
  //award();
})

window.lastY = 0;
window.verticalDirection = null;
document.addEventListener('mousemove', (e) => {
  e.stopPropagation();
  window.verticalDirection = e.clientY > window.lastY ? 'down' : 'up';
  window.lastY = e.clientY;
});