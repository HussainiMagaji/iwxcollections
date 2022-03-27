{//==========================================================

let orderForm = document.getElementById("orderForm");
let proceed = document.getElementById("proceed");
    
orderForm.addEventListener("submit", function( ) {
  fetch("/order", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams(new FormData(orderForm)).toString( )
  }).then(res => res.text( )).then(paymentForm => {
        document.body.insertAdjacentHTML("beforeend", paymentForm);
        proceed.hidden = true;
  });
});

}//==========================================================
