const express = require('express');
const app = express();
const mongoose = require('mongoose');
const {User} = require('./model/User');
const morgan = require('morgan');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {Product} = require('./model/Product');
const {Cart} = require('./model/Cart');
//middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());



let MONGODB = "mongodb+srv://sushmitampatil15:9yLDTbTVf2xuzRWz@cluster0.ktatdjv.mongodb.net/?retryWrites=true&w=majority"
mongoose.connect(MONGODB)
.then(()=>{
    console.log("db is connected")
}).catch((error)=>{
    console.log("db is not connectd", error)
})


//task-1 -> create route for user registration
app.post('/register',async(req,res)=>{
    try{
        let {name, email,password} = req.body;
        if(!name || !email || !password){
            return res.status(400).json({
                message:'Please enter all fields'
            })
        }
        //check if user already exists
        let user = await User.findOne({email});

        if(user){
            return res.status(400).json({
                message: 'User already has a account'
            })
        }else{
            //hash the password
            let salt = await bcrypt.genSalt(10);
            let hashedPassword = bcrypt.hashSync(password,salt);

            //generate token
            const token = jwt.sign({email}, "supersecret",{expiresIn:'365d'})

            //create user
            await User.create({
                name,
                email,
                password : hashedPassword,
                token,
                role: 'user'
            })
            return res.status(200).json({
                message:"User is created successfully"
            })
        }
    }catch(error){
        console.log(error);
        res.status(400).json({message:"Internal Server error"})
    }
})

//task-2 -> create route for user login
app.post('/login', async(req,res)=>{
    try{
      let {email,password} = req.body;
      if(!email || !password){
        return res.status(400).json({
            message : "Plesase enter all fields"
        })
      }

      //check user exists or not
      let user = await User.findOne({email});
      if(!user){
        return res.status(400).json({
            message:"user is not registered, please register first"
        })
      }
       //compare the entered password
       let isPasswordMatched = bcrypt.compareSync(password,user.password);
       if(!isPasswordMatched){
        return res.status(400).json({
            message : "Invalid password"
        })
       }
       return res.status(200).json({
        message:"User is logged in successfuuly",
        id:user._id,
        name:user.name,
        token:user.token,
        email:user.email,
        role:user.role
       })

    }catch(error){
        console.log(error);
        res.status(400).json({message:"Internal Server error"})
    }
})

//task-3 -> create route for see all product
app.get('/products',async(req,res)=>{
    try{
        const products = await Product.find();
        return res.status(200).json({
            products:products
        })
    }catch(error){
        console.log(error);
        res.status(400).json({message:"Internal Server error"})
    }
})

//task-4 create route for add product
app.post('/add-product',async(req,res)=>{
    try{
        let {name,price,stock,brand,image,description} = req.body;
        let {token} = req.headers;
        let decodedToken = jwt.verify(token,"supersecret");
        let user = await  User.findOne({email:decodedToken.email});

        let product = await Product.create({
            name,
            price,
            stock,
            brand,
            image,
            description,
            user:user._id
        })
        return res.status(200).json({
            message:"Product created successfully",
            product:product

        })

    }catch(error){
        console.log(error);
        res.status(400).json({message:"Internal Server error"})
    }
})


//task-5 -> create route to see particular product
app.get('/product/:id',async(req,res)=>{
    try{
        let {id} = req.params;

        if(!id){
            return res.status(400).json({
                message: "Product Id not found"
            })
        }

        let {token} = req.headers;
        let decodedToken = jwt.verify(token,"supersecret");

        if(decodedToken.email){
            const product = await Product.findById(id);

            if(!product){
                return res.status(400).json({
                    message: "Product not found"
                })
            }
            return res.status(200).json({
                product:product
            })
        }

    }catch(error){
        console.log(error);
        res.status(400).json({message:"Internal Server error"})
    }
})

//task-6 -> create route to update product
app.patch('/product/edit/:id',async(req,res)=>{
    try{
        let {id} = req.params;
        let {name,price,stock,brand,image,description} = req.body.productData;
        let {token} = req.headers;
        let decodedToken = jwt.verify(token,"supersecret");
        if(decodedToken.email){
            let updatedProduct = await Product.findByIdAndUpdate(id,{
                name,
                price,
                stock,
                brand,
                image,
                description
            })
            return res.status(200).json({
                message: "Product updated Successfully",
                product:updatedProduct
            })
        }

    }catch(error){
        console.log(error);
        res.status(400).json({message:"Internal Server error"})
    }
})

//task-7 -> create route to delete product
app.delete('/product/delete/:id',async(req,res)=>{
    try{
        let {id} = req.params;
        let {token} = req.headers;
        let decodedToken = jwt.verify(token,"supersecret");
        if(!id){
            return res.status(400).json({
                message: "Product Id not found"
            })
        }
        if(decodedToken.email){
            let deletedProduct = await Product.findByIdAndDelete(id);
            if(!deletedProduct){
                return res.status(400).json({
                    message: "Product not found"
                })
            }
            return res.status(200).json({
                message: "Product deleted Successfully",
                product:deletedProduct
            })
        }


    }catch(error){
        console.log(error);
        res.status(400).json({message:"Internal Server error"})
    }
})

//task-8 -> create route to see all products in cart
app.get('/cart',async(req,res)=>{
    try{
        let {token} = req.headers;
        let decodedToken = jwt.verify(token,"supersecret");
        const user = await User.findOne({email:decodedToken.email}).populate({
            path: 'cart',
            populate:{
                path:'products',
                model: "Product"
            }
        })
        if(!user){
            return res.status(400).json({
                message:"User not found"
            })
        }

        return res.status(200).json({
            cart:user.cart
        })
    }catch(error){
        console.log(error);
        res.status(400).json({message:"Internal Server error"})
    }
})

//task-9 -> create route to add-product in cart
app.post('/cart/add',async(req,res)=>{
    try{
        const body = req.body;
        //getting product id from frontend;
        const productArray = body.products;
        let totalPrice = 0;
        
        //find the product and add product price in total
        for(let item of productArray){
            const product = await Product.findById(item);
            if(product){
                totalPrice += product.price;
            }
        }

        //find the user
        let {token} = req.headers;
        let decodedToken = jwt.verify(token, "supersecret");
        const user = await User.findOne({email:decodedToken.email});

        if(!user){
            return res.status(400).json({
                message:"User not found"
            })
        }
        //checking if user Already has a cart
        let cart;
        if(user.cart){
            cart = await Cart.findById(user.cart).populate('products');
            //extracitng product IDS from the exisitng cart
            const existingProductIds = cart.products.map((product)=>{
                product._id.toString()
            })
            //looping through the newly added products
            //if product is not already in the cart add it to cart
            productArray.forEach(async(productId)=>{
                if(!existingProductIds.includes(productId)){
                    cart.products.push(productId);
                    const product = await Product.findById(productId);
                    totalPrice += product.price; 
                }
            })
            //updating cart total
            //saving the cart
            cart.total = totalPrice;
            await cart.save();
        }else{
            cart = new Cart({
                products:productArray,
                total:totalPrice
            })
            await cart.save();
            user.cart = cart._id;
            await user.save();
        }
        return res.status(200).json({
            message:"cart updated successfully",
            cart:cart
        })
    }catch(error){
        console.log(error);
        res.status(400).json({message:"Internal Server error"})
    }
})


//task-10 create route to delete-product in cart
app.delete('/cart/product/delete',async(req,res)=>{
    try{
        const {productID} = req.body;
        const {token} = req.headers;
        const decodedToken = jwt.verify(token,"supersecret");
        const user = await User.findOne({email:decodedToken.email}).populate('cart');
        if(!user){
            return res.status(400).json({
                message:"User not found"
            })
        }
        const cart = await Cart.findById(user.cart).populate('products');
        if(!cart){
            return res.status(400).json({
                message:"cart not found"
            })
        }
        //findIndex() searches for the product in cart
        const productIndex = cart.products.findIndex(
            (product) => product._id.toString() === productID
        );
        
        if(productIndex === -1){
            return res.status(404).json({
                message:"Product not found in cart"
            })
        }
        cart.products.splice(productIndex,1);
        cart.total = cart.products.reduce(
            (total, product) => total + product.price,
            0
        );
        await cart.save();
        return res.status(200).json({
            message:"Product removed from cart successfully",
            cart:cart
        })
    }catch(error){
        console.log(error);
        res.status(400).json({message:"Internal Server error"})
    }
})

let PORT = 8080;
app.listen(PORT, ()=>{
    console.log(`server is connected to port ${PORT}`)
})