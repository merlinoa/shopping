var express = require('express');
var router = express.Router();
var Cart = require('../models/cart');

var Product = require('../models/products');
var Order = require('../models/order');

/* GET home page. */
router.get('/', function(req, res, next) {
  var successMsg = req.flash('success')[0];
  Product.find(function(err, docs) {
     res.render('shop/index', { 
         title: 'Ractuary', 
         products: docs,
         successMsg: successMsg,
         noMessages: !successMsg }); 
  });
});

router.get('/add-to-cart/:id', function(req, res, next) {
    var productId = req.params.id;
    // pass existing cart if cart already exists otherwise pass empty object
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    
    Product.findById(productId, function(err, product) {
       if (err) {
           return res.redirect('/');
       } 
       cart.add(product, product.id);
       req.session.cart = cart;
       console.log(req.session.cart);
       res.redirect('/');
    });
});

router.get('/shopping-cart', function(req, res, next) {
   if(!req.session.cart) {
       return res.render('shop/shopping-cart', {products: null});
   } 
   var cart = new Cart(req.session.cart);
   res.render('shop/shopping-cart', { 
       products: cart.generateArray(), 
       totalPrice: cart.totalPrice
   });
});

router.get('/checkout', isLoggedIn, function(req, res, next) {
   if(!req.session.cart) {
       return res.redirect('/shopping-cart');
   }
   var cart = new Cart(req.session.cart);
   var errMsg = req.flash('error')[0];
   res.render('shop/checkout', {
       totalPrice: cart.totalPrice, 
       errMsg: errMsg,
       noErrors: !errMsg
   }); 
});

router.post('/checkout', isLoggedIn, function(req, res, next) {
    if (!req.session.cart) {
        return res.redirect('/shopping-cart');
    }
    var cart = new Cart(req.session.cart);
    // Set your secret key: remember to change this to your live secret key in production
    // See your keys here https://dashboard.stripe.com/account/apikeys
    var stripe = require("stripe")("sk_test_Q5Ngru27SVKpAPZdsJRdlDYS");

    var charge = stripe.charges.create({
        amount: cart.totalPrice * 100, // amount in cents, again
        currency: "usd",
        source: req.body.stripeToken,
        description: "Example charge"
    }, function(err, charge) {
        if (err && err.type === 'StripeCardError') {
            // The card has been declined
            req.flash('error', err.message);
            return res.redirect('/checkout');
        } 
        var order = new Order({
            user: req.user,
            cart: cart,
            address: req.body.address,
            name: req.body.name,
            paymentId: charge.id
        });
        order.save(function(err, result) {
            req.flash('success', 'You made a purchase!');
            req.session.cart = null;
            res.redirect('/');     
        });
    });
});

module.exports = router;

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    // store the old url so that we can return to 
    // the cart checkout once the user signs in
    req.session.oldUrl = req.url;
    res.redirect('/user/signin');
}
