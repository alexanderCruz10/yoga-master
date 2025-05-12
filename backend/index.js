
// eslint-disable-next-line no-undef
const express = require('express')
const app = express()
// eslint-disable-next-line no-undef
const cors = require('cors')
// eslint-disable-next-line no-undef
require('dotenv').config()
const port = 3000

// middleware
app.use(cors())
app.use(express.json())

//mongoDB connection


// eslint-disable-next-line no-undef
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb'); // Added ObjectId import
// eslint-disable-next-line no-undef
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@yogamaster.ebvzo4u.mongodb.net/
?retryWrites=true&w=majority&appName=yogaMaster`;

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

    //create a database
    const database = client.db('yogamaster');
    //create a collection
    const userCollection = database.collection('users');
    const classesCollection = database.collection('classes');
    const cartCollection = database.collection('cart');
    const paymentCollection = database.collection('payments');
    const enrollmentCollection = database.collection('enrolled');
    const appliedCollection = database.collection('applied');

    //POST: add new class
    app.post('/new-class', async (req, res) => {
      const newClass = req.body;
      //newClass.availableSeats = parseInt(newClass.availableSeats);
      const result = await classesCollection.insertOne(newClass);
      res.send(result);

    })
    //GET: gets all classes
    app.get('/classes', async (req, res) => {
      const query = {status: 'approved'}; 
      const result = await classesCollection.find().toArray();
      res.send(result);
    })

    //GET: gets classes by instructor's email
    app.get('/classes/:email', async (req, res) => {
      const email = req.params.email;
      const query = { instructorEmail: email };
      const result = await classesCollection.find(query).toArray();
      res.send(result);
    })

    //GET: manages all classes
    app.get('/classes-manage', async (req, res) => {
      const query = {};
      const result = await classesCollection.find(query).toArray();
      res.send(result);
    })

    //Update: class status and reason
    app.put('/change-status/:id', async (req, res) => {
      const id = req.params.id;
      const status = req.body.status;
      const reason = req.body.reason;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: status,
          reason: reason
        },
      };
      const result = await classesCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    })

    //GET: gets approved classes
    app.get('/approved-classes', async (req, res) => {
      const query = { status: 'approved' };
      const result = await classesCollection.find(query).toArray();
      res.send(result);
    })

    //GET: gets single class by id
    app.get('/class/:id',async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await classesCollection.findOne(query);
      res.send(result);
    })

    //Update: update class
    app.put('/update-class/:id', async (req, res) => {
      const id = req.params.id;
      const updatedClass = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name: updatedClass.name,
          description: updatedClass.description,
          price: updatedClass.price,
          availableSeats: parseInt(updatedClass.availableSeats) ,
          videoLink: updatedClass.videoLink,
          status: 'pending',
        },
      };
      const result = await classesCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    })

    //!--Cart Routes--!

    //POST: add to cart
    app.post('/add-to-cart', async (req,res) => {
      const newCartItem = req.body;
      const result = await cartCollection.insertOne(newCartItem);
      res.send(result);
    })
    //GET: get cart items by id
    app.get('/cart-item/:id', async (req, res) => {
      const id = req.params.id;
      const email = req.query.email;
      const query = { classId: id, userMail: email };
      const projection = { classId: 1 };
      const result = await cartCollection.findOne(query, { projection: projection });
      res.send(result);
    })

    //GET: get cart items by email
    app.get('/cart/:email', async (req, res) => {
      const email = req.params.email;
      const query = { userMail: email };
      const projection = { classId: 1 };
      const carts = await cartCollection.find(query, { projection: projection }).toArray();
      const classIds = carts.map(cart => new ObjectId(cart.classId));
      const query2 = { _id: { $in: classIds } };
      const result = await classesCollection.find(query2).toArray();
      res.send(result);
    })
    //DELETE: remove from cart
    app.delete('/delete-cart-item/:id', async (req, res) => {
      const id = req.params.id;
      const query = { classId: id };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
