{//==========================================================
let storefront = document.getElementById("storefront");
let cols = document.getElementsByClassName("col");
let EOF = false;

storefront.addEventListener("click", (e) => {
    let target = e.target.closest("div");
    if(target.classList.contains("products")) {
       location.href = `/cart/${target.id}`;
    }
});

document.addEventListener("scroll", ( ) => {

  if((window.innerHeight + window.pageYOffset) >= 
     (document.body.offsetHeight - 100)) {

      let divs = document.getElementsByClassName("products");
      let idx = divs.length;

      if(EOF) {
	 return;
      }

      fetch(`/products/${idx}`).then(res => res.json( )).
	then(products => {

	     if(products.length < 20) {                                       EOF = true;                                                }
		
	     products.forEach(product => {
		let item = divs[0].cloneNode(true);
		let spans = item.getElementsByTagName("span");

		item.id = product.id;
		item.children[0].src = `/images/album/${product.url}`;
		spans[0].textContent = product.name;
		spans[1].innerHTML = `&#8358;${( ((15/100) * product.price) + product.price ).toLocaleString( )}`;
		spans[2].innerHTML = `&#8358;${( ((10/100) * product.price) + product.price ).toLocaleString( )}`;
	
		if((item.id%2) == 0) {
		   cols[1].append(item);
		} else {
		   cols[0].append(item);
		}
	     });

      });

  }

});
};//==========================================================
