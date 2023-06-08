const express = require('express');
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000;
app.use(cors())
app.use(express.json())





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

    const classCollection = client.db('summerCampDb').collection('classes')
    const instructorCollection = client.db('summerCampDb').collection('instructors')
    const selectedClassCollection = client.db('summerCampDb').collection('selectedClass');


    app.get('/selectedClass/:email',async(req, res)=>{
      const email = req.params.email;
      if(!email){
        res.send([])
      }
      const query = {studentEmail: email}
      const result = await selectedClassCollection.find(query).toArray()
      res.send(result)
    } )

    app.post('/selectedClass', async(req,res)=>{
      const selectedClass = req.body;
      const result =await selectedClassCollection.insertOne(selectedClass);
      console.log(result)
      res.send(result);
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