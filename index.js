const express = require('express');
const cors = require('cors')
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000;
app.use(cors())
app.use(express.json())

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  // bearer token
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8bsin5j.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
     
    const usersCollection = client.db('summerCampDb').collection('users')
    const classCollection = client.db('summerCampDb').collection('classes')
    const instructorCollection = client.db('summerCampDb').collection('instructors')
    const selectedClassCollection = client.db('summerCampDb').collection('selectedClass');


    app.post('/jwt', async(req, res)=>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' })

      res.send({ token })
    })

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      if (user?.role !== 'admin') {
        return res.status(403).send({ error: true, message: 'forbidden message' });
      }
      next();
    }

    const verifyInstructor = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      if (user?.role !== 'instructors') {
        return res.status(403).send({ error: true, message: 'forbidden message' });
      }
      next();
    }

    app.get('/users',verifyJWT,verifyAdmin, async(req, res)=>{
      const result = await usersCollection.find().toArray()
      res.send(result)
    })
    app.get('/users',verifyJWT,verifyInstructor, async(req, res)=>{
      const result = await usersCollection.find().toArray()
      res.send(result)
    })

    app.post('/users', async(req, res)=>{
      const user = req.body;
      console.log(user)
      const query ={email : user.email}
      const existingUser = await usersCollection.findOne(query)
      if(existingUser){
        return res.send({message:'User already exist'})
      }
      const result = await usersCollection.insertOne(user);
      res.send(result)
    })


    app.get('/users/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ admin: false })
      }

      const query = { email: email }
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role === 'admin' }
      res.send(result);
    })

    app.patch('/users/admin/:id', async(req, res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}

      const updatedDoc={
        $set:{
          role:'admin'
        }
      }
      const result = await usersCollection.updateOne(filter, updatedDoc)
      res.send(result)
    })

    app.get('/users/instructors/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ instructors: false })
      }

      const query = { email: email }
      const user = await usersCollection.findOne(query);
      const result = { instructor: user?.role === 'instructors' }
      res.send(result);
    })

    app.patch('/users/instructors/:id', async(req, res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}

      const updatedDoc={
        $set:{
          role:'instructors'
        }
      }
      const result = await usersCollection.updateOne(filter, updatedDoc)
      res.send(result)
    })


    app.get('/selectedClass/:email',verifyJWT,async(req, res)=>{
      const email = req.params.email;
      if(!email){
        res.send([])
      }

      const decodedEmail = req.decoded.email;
      if(email !== decodedEmail) {
        return res.status(403).send({ error: true, message: 'forbidden access' })
      }

      const query = {studentEmail: email}
      const result = await selectedClassCollection.find(query).toArray()
      res.send(result)
    } )
    

    app.delete('/selectedClass/:id', async(req, res)=>{
      const id = req.params.id
      const query ={_id: new ObjectId(id)}
      const result = await selectedClassCollection.deleteOne(query)
      res.send(result)
    })

    app.get('/classes/:email', async(req, res)=>{
      const email = req.params.email;
      if(!email){
        res.send([])
      }
      const query = {email: email}
      const result = await classCollection.find(query).toArray()
      res.send(result)
    })

    app.get('/classes', async(req,res)=>{
        const result = await classCollection.find().toArray()
        res.send(result)
    })

    app.post('/classes', async(req, res)=>{
      const classInfo = req.body;
      const result = await classCollection.insertOne(classInfo)
      // console.log(result)
      res.send(result)
    })

    app.get('/instructors', async(req, res)=>{
        const result = await instructorCollection.find().toArray()
        
        res.send(result)
    })

    // app.post('/createPayment', async(req, res)=>{
    //   const{ price} = req.body;
    //   console.log(price)
    //   const amount = price * 100;
    //   const paymentIntent = await stripe.paymentIntents.create({
    //     amount: amount,
    //     currency: "usd",
    //     payment_method_types: [
    //       "card"
    //     ],
    //   });

    //   // res.send({clientSecret: paymentIntent.client_secret});
    // })


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get('/',(req, res) =>{
    res.send('summer server is running')
})

app.listen(port, ()=>{
    console.log('port is running', port)
})