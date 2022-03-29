let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
let ExcelJS = require('exceljs');

let { generateRRR, 
      initiatePayment } = require("./routes/remita.js");


function validateEmail(emailAdress) {                           let regexEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (emailAdress.match(regexEmail)) {
    return true;
  } else {
    return false;
  }
}
//===========================================================
let products;
async function getProductsCSV(path) {
    const wb = new ExcelJS.Workbook( );
    const ws = await wb.csv.readFile(path);

    let id = ws.getColumn(1).values.splice(2);
    let url = ws.getColumn(2).values.splice(2);
    let name = ws.getColumn(5).values.splice(2);
    let price = ws.getColumn(6).values.splice(2);

    let items = [ ];
    for(let i = 0; i < url.length; ++i) {
        items.push({id: id[i], url: url[i], name: name[i], price: price[i]});
    }

    return items;
}
(async ( ) => {
    products = await getProductsCSV("./public/data/products.csv");
})( );

let idx = 0;

//=======================================================

let cart = [];
let orders = [];
let user = { };
let login_status = 0;
let login_referer = "";

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.render("index.ejs");
});
app.get("/home", (req, res) => {
  res.render("index.ejs");
});
app.get("/shop", (req, res) => {
  res.render("shop.ejs", { products: products });
});
app.get("/products/:idx", (req, res) => {
  res.send(products.slice(req.params.idx));
});
app.get("/cart", (req, res) => {
  res.render("cart.ejs", { 
	cart: cart,
	product: null,
	quantityValue: null
  });
});
app.get("/login", (req, res) => {
  login_referer = req.headers.referer;
  if(login_status) { //if user is already logged in
     res.redirect("/account");
     return;
  }
  res.render("login.ejs");
});
app.get("/account", (req, res) => {
  res.render("account.ejs", {
     email: user.email,
     orders: orders
  });
});
app.get("/checkout", (req, res) => {
  let subtotal = 0;
  let shipping_fee = 1000;

  if(login_status == 0) { //user is not logged in
     res.redirect("/login");
     return;
  }

  if(cart.length) {
     cart.forEach(product => {
	subtotal += (product.price * product.quantity);
     });
     subtotal += ((10/100) * subtotal);
     res.render("checkout.ejs", {
	subtotal: subtotal.toLocaleString( ),
	shipping_fee: shipping_fee.toLocaleString( ),
	gross_total: (subtotal+shipping_fee).toLocaleString( )
     });
     user.amount = subtotal + shipping_fee;
  } else {
     res.render("shop.ejs", { products: products });
  }
});
app.get("/cart/:id", (req, res) => {
  let quantityValue = 1;
  for(let i = 0; i < cart.length; ++i) { 
    if(cart[i].id == req.params.id) {
      quantityValue = cart[i].quantity;
      cart.splice(i, 1); //remove the duplicate
    } 
  }

  res.render("cart.ejs", { 
	cart: cart, product: 
	products[req.params.id - 1],
	quantityValue: quantityValue
  });
});
app.get("/webhook", (req, res) => {
  if(!login_status) {
     res.redirect("/login");
     return;
  }
  orders.forEach(order => { //check for duplicate order
    if(order.id == req.query.orderID) {
       res.redirect("/login");
       return;
    }
  });
  orders.push({
     id: req.query.orderID,
     rrr: req.query.RRR, 
     date: new Date( ).toString( ).slice(0, 33)
  });
  //send cart and orders to db for management
  cart = []; //empty cart
  res.redirect("/account"); 
});

app.post("/cart", (req, res) => {
  let product = req.body;
  cart.push(products[product.id - 1]);
  cart[cart.length - 1].quantity = product.quantity;
  
  res.end("SUCCESS");
});
app.post("/order", async (req, res) => {
  Object.assign(user, req.body);
  let response = await generateRRR(user);
  switch(response.statuscode) {
    case "025": {
      user.RRR = response.RRR;
      response = await initiatePayment(user); 
    } break;
    default: {
      //res.redirect("/checkout");
      //return;
    }
  }
  res.send(response);
});
app.post("/login", (req, res) => {
  //validate email
  if(!validateEmail(req.body.email)) {
     res.redirect("/login");
     return;
  }
  //verify existence and authentify password
  login_status = 1;
  
  Object.assign(user, req.body);
  console.log(login_referer); //TODO
  res.redirect('/');
});
app.post("/signup", (req, res) => {
  //validate email
  if(!validateEmail(req.body.email)) {
     res.redirect("/login");
     return;
  }
  //verify email uniqueness
  if(req.body.pswd !== req.body.cpswd) {
     res.redirect("/login");
     return;
  }
  //add user to db
  login_status = 1;

  Object.assign(user, req.body);
  console.log(login_referer); //TODO
  res.redirect('/');
});

app.delete("/cart/:id", (req, res) => {
  let i, deleted;
  for(i = 0; i < cart.length; ++i) {
      if(cart[i].id == req.params.id) {
	 deleted = cart.splice(i, 1);
	 break;
      }
  }
  res.json(deleted);
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

