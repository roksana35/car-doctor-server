const express = require('express');
const cors = require('cors');
const jwt =require('jsonwebtoken')
const cookieparser=require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
    origin:[
        'http://localhost:5173',
        'https://car-doctor-crud-39fae.web.app',
        'https://car-doctor-crud-39fae.firebaseapp.com'
    ],
    credentials:true
}));
app.use(express.json());
app.use(cookieparser())




console.log(process.env.DB_PASS)
console.log(process.env.DB_USER)



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qmgfwvr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
console.log(uri)
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }


});
const logger=(req,res,next)=>{
    console.log('log info',req.method,req.url)
    next()
}
    

const verifytoken=(req,res,next)=>{
    const token=req.cookies.token;
    console.log('token in the middlewar',token)
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
        if(!token){
            return res.status(401).send({message:'unauthorize access'})
        }
        req.user=decoded
        next()
    })
  
}


const cookieOptions={
    httpOnly:true,
                secure:process.env.NODE_ENV ==='production'?true:false,
                sameSite:process.env.NODE_ENV ==='production'?'none':'strict',

}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const serviceCollection = client.db('car-doctor').collection('services');
        const bookingCollection = client.db('car-doctor').collection('bookings');


        // auth related api
        app.post('/jwt',async(req,res)=>{
            const user=req.body;
            console.log('user for token',user)
            const token=jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'})
            res.cookie('token',token,cookieOptions)
            .send({success:true})
        })

        app.post('/logout',async(req,res)=>{
            const user = req.body;
            console.log('logout user',user)
            res.clearCookie('token',{...cookieOptions,maxAge:0}).send({success:true})
        })

        app.get('/services', async (req, res) => {
            const cursor = serviceCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }

            const options = {
                // Include only the `title` and `imdb` fields in the returned document
                projection: { title: 1, price: 1, service_id: 1, img: 1 },
            };

            const result = await serviceCollection.findOne(query, options);
            res.send(result);
        })


        // bookings 
        app.get('/bookings',logger,verifytoken, async (req, res) => {
            console.log(req.query.email);
            
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            if(req.user.email !== req.query.email){
                return res.status(403).send({message:'forbiden access'})
            }
            const result = await bookingCollection.find(query).toArray();
            res.send(result);
        })

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        });

        app.patch('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedBooking = req.body;
            console.log(updatedBooking);
            const updateDoc = {
                $set: {
                    status: updatedBooking.status
                },
            };
            const result = await bookingCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await bookingCollection.deleteOne(query);
            res.send(result);
        })


    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
   
  }
}
run().catch(console.dir);






// akbeNQZFDw2ikFhI
// carDB





app.get('/', (req, res) => {
    res.send('doctor is running')
})

app.listen(port, () => {
    console.log(`Car Doctor Server is running on port ${port}`)
})