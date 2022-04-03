{//========================================================

let perfEntries = performance.getEntriesByType('navigation');
if(perfEntries.length && perfEntries[0].type === 'back_forward') {
  location.href = "/shop";
}


let handler = {

   handleEvent(event) {
      let target = event.target;
      switch(event.target.id) {
	case "minus": this.minus( ); break;
	case "plus": this.plus( ); break;
	case "append": this.append(event.target); break;
      }
   },

   minus( ) {
      let quantity = window["minus"].nextElementSibling;
      if(quantity.value > quantity.min) { --quantity.value; }
   },

   plus( ) {
      let quantity = window["plus"].previousElementSibling;
      if(quantity.value < quantity.max) { ++quantity.value; }
   },

   append(target) {

      let item = target.closest("div");
      let quantity = window["quantity"].value;
      Array.from(item.children).forEach(child => {
	 switch(child.tagName) {
	   case "INPUT":
	   case "BUTTON": child.remove( ); break;
	 }
      });
      item.getElementsByTagName("span")[1].append(quantity);
      fetch("/cart", {
	 method: "POST",
	 headers: {
	    "Content-Type": "application/json"
	 },
	 body:JSON.stringify({id:item.id, quantity: quantity})
      }).then(res => res.text( )).then(location.href = "/cart").catch(err => { location.href = "/cart"; });

   },

   deleteItem(event) {
	let target = event.target;
	if(target.classList.contains("delete")) {
	   let targetDiv = target.closest("div");
	   fetch(`/cart/${targetDiv.id}`, {
		method: "DELETE"
	   }).then(res => res.text( )).then(json => {
		targetDiv.remove( );
	   }).catch(err => alert(err));
	}
   }


};

window["itemholder"].addEventListener("click", handler);
window["cartholder"].addEventListener("click", ( ) => handler.deleteItem(event));
window["checkout"].addEventListener("click", ( ) => location.href = "/checkout");

};//=========================================================
