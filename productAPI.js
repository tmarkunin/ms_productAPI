var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

// necessary for running APIs locally
var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
 
  // intercept OPTIONS method
  if ('OPTIONS' == req.method) {
    res.send(200);
  }
  else {
    next();
  }
};
 
app.use(allowCrossDomain);
 
// configure app to use bodyParser()
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
 
 
// MongoDB - used by all services
if(process.env.VCAP_SERVICES){
	var services = JSON.parse(process.env.VCAP_SERVICES);
  if(services.mongodb) {
    uri = services.mongodb[0].credentials.url;
  }  
  else if (services['compose-for-mongodb']){
  	
  	uri = services['compose-for-mongodb'][0].credentials.uri;
  }else {
    uri = process.env.MONGO_URI;
  }
} else {
	uri = process.env.MONGO_URI;
}

console.log('uri' + uri);
mongoose.connect(uri);
 
// Set up /api router
var router = express.Router();
 
 
 
/* MONGOOSE Schema Goes Here */
// Mongoose Models
var Product = require('./models/product');
 
/* ------------------------------------------------------------------------
-- A P I  C O D E ---------------------------------------------------------
------------------------------------------------------------------------ */
 
router.route('/products').get(function(req, res) {
    Product.find(function(err, products) {
        if (err)
            res.send(err);

        res.json(products);
    });
});

router.route('/products/:product_id')

    // get the product with that id (accessed at GET http://localhost:6005/api/products/:product_id)
    .get(function(req, res) {
        Product.findById(req.params.product_id, function(err, product) {
            if (err)
                res.send(err);
            res.json(product);
        });
    })

		// update the product to be in the cart
    .put(function(req, res) {

        // use our product model to find the product we want
        
        console.log('body:**********' + req.body);
        Product.findById(req.params.product_id, function(err, product) {

            if (err)
                res.send(err);
                
//!!!!!!!!!!!!!!!!!!!
            product.inCart = true;  //req.body.inCart;  // update the products info

            // save the product
            product.save(function(err) {
                if (err)
                    res.send(err);

                res.json({ message: 'Product updated. (' + product._id + ')'});
            });
        });
    });

 
/* ------------------------------------------------------------------------
-- S T A R T   S E R V E R ------------------------------------------------
------------------------------------------------------------------------ */
 
app.use('/api', router);
 
// get the app environment from Cloud Foundry
var port = process.env.PORT || 10080;
 
// start server on the specified port and binding host
app.listen(port, function() {
 console.log("server starting on port: " + port);
});