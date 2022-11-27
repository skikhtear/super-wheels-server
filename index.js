const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
require('dotenv').config();
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());




function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.2op2kxu.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


const usersCollection = client.db('superWheels').collection('users');
const categoryCollection = client.db('superWheels').collection('category');
const sellPostCollection = client.db('superWheels').collection('sellpost');
const bookingsCollection = client.db('superWheels').collection('bookings');

async function  run(){
    try{





        const verifyAdmin = async (req, res, next) =>{
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);
    
            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next();
        }
        const verifySeller = async (req, res, next) =>{
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);
    
            if (user?.role !== 'seller') {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next();
        }


        app.get('/category', async(req, res)=>{
            const query = {};
            const result = await categoryCollection.find(query).toArray();
            res.send(result)
        })


        app.get('/sellpost',async (req,res)=>{
            const query = {};
            const result = await sellPostCollection.find(query).toArray();
            res.send(result)
        })
        
        app.get('/sellpost/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const sellpost = await sellPostCollection.findOne(query);
            res.send(sellpost);
        })


        app.get('/sellposts',verifyJWT,verifySeller, async(req, res)=>{
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
    
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            const query = {email: email};
            const posts = await sellPostCollection.find(query).toArray();
            res.send(posts)  
        })

        app.post('/sellpost', async(req, res)=>{
            const doctor = req.body;
            const result = await sellPostCollection.insertOne(doctor);
            res.send(result);
        })

        app.delete('/sellpost/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await sellPostCollection.deleteOne(filter);
            res.send(result);
        })

        app.get('/category/:id',async (req, res) => {
            const id = req.params.id;
            const query = {category_id: id};
            const category_post =await sellPostCollection.find(query).toArray();
            res.send(category_post)
        
        });


        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '24h' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
        });



        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });
        app.get('/users/seller', async (req, res) => {
            const query = {role: "seller"};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });
        app.get('/users/buyer', async (req, res) => {
            const query = {role: "buyer"};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });
    
    
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role==='admin' });
        });
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.role === 'seller' });
        });


        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });
        
        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        })

        app.post('/bookings',async(req, res)=>{
            const booking =req.body;
            console.log(booking);
            const query = {
                productName: booking.productName,
                price: booking.price,
                name:booking.name,
                email: booking.email,
                location:booking.location,
                phone:booking.phone

            }
    
            const alreadyBooked = await bookingsCollection.find(query).toArray();
    
            if (alreadyBooked.length){
                const message = `You already have a booking on ${booking.name}`
                return res.send({acknowledged: false, message})
            }
    
            const result = await bookingsCollection.insertOne(booking);
            res.send(result)
        })
        
    }
    finally{

    }
}
run().catch(console.log)




app.get('/', async(req,res)=>{
    res.send('Super Wheels server is running')
})
app.listen(port, ()=>console.log(`Super Wheels server running on ${port}`))



