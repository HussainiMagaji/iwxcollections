{//=======================================================
let categories = document.getElementById("categories");

function bannerChanger( ) {
    let i = 0, banner = document.getElementById("banner");

    setInterval(function( ) {
        banner.src=`/images/banners/${i = (i == 6)? 0: ++i}.png`;
    }, 10000);
}

categories.addEventListener("click", ( ) => {
    window.location.href = "shop"; //GET http..../shop
});
document.addEventListener("DOMContentLoaded", bannerChanger);
document.addEventListener("DOMContentLoaded", ( ) => window.scrollY = 0);
};//=======================================================
