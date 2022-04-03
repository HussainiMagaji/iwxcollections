let cookieParser = require('cookie-parser');
let createError = require('http-errors');
let compression = require('compression');
let session = require('express-session');
let express = require('express');
let logger = require('morgan');
let path = require('path');
let ExcelJS = require('exceljs');

let validateEmail = require('./lib/email/validate.js');
let { generateRRR, 
     initiatePayment } = require('./lib/remita/remita.js');


//=========================================================
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

let Cart = require("./models/cart.js");

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.disable('x-powered-by');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(compression({ threshold: 1 }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
   secret: '/^+([-]?+)*@+([-]?)*({2,3})+$/secretus-x-o-x',
   resave: false,
   saveUninitialized: true,
   unset: 'destroy',
   name: 'iwxcollections-cookie'
}));

app.use('*', (req, res, next) => { 
  if(!req.session.cart) { //TODO
     req.session.user = { };
     req.session.user.orders = [];
     req.session.cart = new Cart( );
     console.log(`\nNew Client connected.\n${req.headers['user-agent']}\nID: ${req.sessionID}\n`);
  }
  next( );
})

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

app.get("/login", (req, res) => {
  let user = req.session.user; //TODO
  if(user.email) {
     res.redirect("/account");
     return;
  }
  res.render("login.ejs");
});

app.get("/account", (req, res) => {
  let user = req.session.user, //TODO
      orders = req.session.user.orders;
  res.render("account.ejs", {
     email: user.email,
     orders: orders
  });
});

app.get("/cart", (req, res) => {
  let cart = req.session.cart; //TODO
  res.render("cart.ejs", { 
	cart: cart.items,
	product: null,
	quantityValue: null
  });
});

app.get("/cart/:id", (req, res) => {

  let cart = req.session.cart, //TODO
      id = req.params.id, 
      quantityValue = 1;

  if(Cart.getItem(cart, id)) { //Product in cart?
     quantityValue = Cart.getItem(cart, id).quantity;
     Cart.remove(cart, id); //remove from cart
  }

  res.render("cart.ejs", {
     cart: cart.items,
     product: products[id - 1],
     quantityValue: quantityValue
  });
});

app.get("/checkout", (req, res) => {
  let user = req.session.user, //TODO
      cart = req.session.cart, //TODO
      subtotal = cart.amount, //total amount of items
      shipping_fee = 1000;

  if(!user.email) { //user is not logged in
     res.redirect("/login");
     return;
  }

  subtotal += ((10/100) * cart.amount); //10% commission
  user.amount = subtotal + shipping_fee;

  res.render("checkout.ejs", {
    subtotal: subtotal.toLocaleString( ),
    shipping_fee: shipping_fee.toLocaleString( ),
    gross_total: (subtotal+shipping_fee).toLocaleString( )
  });
});

app.get("/webhook", (req, res) => {
  let cart = req.session.cart,
      orders = req.session.user.orders;

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
  Cart.clear(cart); //empty cart
  res.redirect("/account"); 
});

app.post("/cart", (req, res) => {
  let cart = req.session.cart, //TODO
      id = req.body.id,
      quantity = req.body.quantity,
      product = products[id - 1];

  product.quantity = quantity;
  let status = Cart.append(cart, product);
  res.end(String(status)); //return status
});

app.post("/order", async (req, res) => {
  let user = req.session.user; //TODO
  Object.assign(user, req.body);

  let response = await generateRRR(user);
  switch(response.statuscode) {
    case "025": {
      user.RRR = response.RRR;
      response = await initiatePayment(user); 
    } break;
    default: {
      console.log(response);
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
  let user = req.session.user;
  //verify existence and authentify password
  Object.assign(user, req.body);
  res.redirect('/'); //TODO
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
  let user = req.session.user; //TODO
	
  Object.assign(user, req.body);
  res.redirect('/'); //TODO
});

app.delete("/cart/:id", (req, res) => {
  let cart = req.session.cart;
  Cart.remove(cart, req.params.id)
  res.json({status: "deleted"});//TODO
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

