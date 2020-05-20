const navslide = () => {
  const burger = document.querySelector(".burger");
  const nav = document.querySelector(".navlinks");

  burger.addEventListener("click", () => {
    nav.classList.toggle("nav-active");
    burger.classList.toggle("toggle");
  });
};

navslide();

var scroll = new SmoothScroll('.smooth a[href*="#"]', {
  speed: 900,
});
//navLinks.forEach(link, index) => {
// if(link.style.animation){
//  link.style.animation = ""
//}else{
//  link.style.animation = 'navLinkFade 0.5s ease forwards ${index/7+0.3}s'
// }
//    })
//   })
