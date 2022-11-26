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

async function  run(){
    try{
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

        app.get('/category/:id',async (req, res) => {
            const id = req.params.id;
            const query = {category_id: id};
            const category_post =await sellPostCollection.find(query).toArray();
            res.send(category_post)
        
        });


        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });
    
    
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        });


        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await usersCollection.insertOne(user);
            res.send(result);
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


        app.post('/sellpost',verifyJWT, async(req, res)=>{
            const doctor = req.body;
            const result = await sellPostCollection.insertOne(doctor);
            res.send(result);
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



