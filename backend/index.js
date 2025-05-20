/* eslint-disable no-undef */

// eslint-disable-next-line no-undef
const express = require("express");
const app = express();
// eslint-disable-next-line no-undef
const cors = require("cors");
// eslint-disable-next-line no-undef
require("dotenv").config();
const stripe = require('stripe')(process.env.PAYMENT_SECRET);
var jwt = require('jsonwebtoken');
const port = 3000;

// middleware
app.use(cors());
app.use(express.json());

//verify token 
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: "unauthorized access" });
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ error: true, message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
}

//mongoDB connection
// eslint-disable-next-line no-undef
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb"); // Added ObjectId import
// eslint-disable-next-line no-undef
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@yogamaster.ebvzo4u.mongodb.net/
?retryWrites=true&w=majority&appName=yogaMaster`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    //create a database
    const database = client.db("yogamaster");
    //create a collection
    const userCollection = database.collection("users");
    const classesCollection = database.collection("classes");
    const cartCollection = database.collection("cart");
    const paymentCollection = database.collection("payments");
    const enrollmentCollection = database.collection("enrolled");
    const appliedCollection = database.collection("applied");


    //!--JWT--!
    app.post("/api/set-token", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_SECRET, {
        expiresIn: "24h",
      });
      res.send({ token });
    })
    //!--User Routes--!
    //POST: create a user
    app.post("/new-user", async (req, res) => {
      const newUser = req.body; 
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    //GET: get all users
    app.get("/users", async (req, res) => {
      const query = {};
      const result = await userCollection.find(query).toArray();
      res.send(result);
    });
    //GET: get user by id
    app.get("/user/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.findOne(query);
      res.send(result);
    });
    //GET: get user by email
    app.get("/user/:email", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await userCollection.findOne(query);
      res.send(result);
    }); 
    //DELETE: delete user
    app.delete("/delete-user/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });
    //PUT: update user
    app.put("/update-user/:id", async (req, res) => {
      const id = req.params.id;
      const updatedUser = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.options,
          address: updatedUser.address,
          about: updatedUser.about,
          photoUrl: updatedUser.photoUrl,
          skills: updatedUser.skills ? updatedUser.skills : null
        }
      };
      const result = await userCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    //POST: add new class
    app.post("/new-class", async (req, res) => {
      const newClass = req.body;
      //newClass.availableSeats = parseInt(newClass.availableSeats);
      const result = await classesCollection.insertOne(newClass);
      res.send(result);
    });
    //GET: gets all classes
    app.get("/classes", async (req, res) => {
      const query = { status: "approved" };
      const result = await classesCollection.find().toArray();
      res.send(result);
    });

    //GET: gets classes by instructor's email
    app.get("/classes/:email", async (req, res) => {
      const email = req.params.email;
      const query = { instructorEmail: email };
      const result = await classesCollection.find(query).toArray();
      res.send(result);
    });

    //GET: manages all classes
    app.get("/classes-manage", async (req, res) => {
      const query = {};
      const result = await classesCollection.find(query).toArray();
      res.send(result);
    });

    //Update: class status and reason
    app.put("/change-status/:id", async (req, res) => {
      const id = req.params.id;
      const status = req.body.status;
      const reason = req.body.reason;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: status,
          reason: reason,
        },
      };
      const result = await classesCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    //GET: gets approved classes
    app.get("/approved-classes", async (req, res) => {
      const query = { status: "approved" };
      const result = await classesCollection.find(query).toArray();
      res.send(result);
    });

    //GET: gets single class by id
    app.get("/class/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await classesCollection.findOne(query);
      res.send(result);
    });

    //Update: update class
    app.put("/update-class/:id", async (req, res) => {
      const id = req.params.id;
      const updatedClass = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name: updatedClass.name,
          description: updatedClass.description,
          price: updatedClass.price,
          availableSeats: parseInt(updatedClass.availableSeats),
          videoLink: updatedClass.videoLink,
          status: "pending",
        },
      };
      const result = await classesCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    //!--Cart Routes--!
    //POST: add to cart
    app.post("/add-to-cart", async (req, res) => {
      const newCartItem = req.body;
      const result = await cartCollection.insertOne(newCartItem);
      res.send(result);
    });
    //GET: get cart items by id
    app.get("/cart-item/:id", async (req, res) => {
      const id = req.params.id;
      const email = req.query.email;
      const query = { classId: id, userMail: email };
      const projection = { classId: 1 };
      const result = await cartCollection.findOne(query, {
        projection: projection,
      });
      res.send(result);
    });

    //GET: get cart items by email
    app.get("/cart/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userMail: email };
      const projection = { classId: 1 };
      const carts = await cartCollection
        .find(query, { projection: projection })
        .toArray();
      const classIds = carts.map((cart) => new ObjectId(cart.classId));
      const query2 = { _id: { $in: classIds } };
      const result = await classesCollection.find(query2).toArray();
      res.send(result);
    });
    //DELETE: remove from cart
    app.delete("/delete-cart-item/:id", async (req, res) => {
      const id = req.params.id;
      const query = { classId: id };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });

    //!--Payment Routes--!

    //POST: create payment intent
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseFloat(price) * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({ clientSecret: paymentIntent.client_secret });
    });

    //POST: payment info to db
    app.post("/payment-info", async (req, res) => {
      const paymentInfo = req.body;
      const classesId = paymentInfo.classId;
      const userEmail = paymentInfo.userMail;
      const singleClassId = paymentInfo.singleClassId;
      let query;
      if (singleClassicId) {
        query = { classId: singleClassId, userMail: userEmail };
      } else {
        query = { classId: { $in: classesId } };
      }

      const classesQuery = {
        _id: { $in: classesId.map((id) => new ObjectId(id)) },
      };
      const classes = await classesCollection.find(classesQuery).toArray();
      const newEnrollmentData = {
        userMail: userEmail,
        classId: singleClassId.map((id) => new ObjectId(id)),
        transactionId: paymentInfo.transactionId,
      };
      const updateDoc = {
        $set: {
          totalEnrolled:
            classes.reduce(
              (total, current) => total + current.totalEnrolled,
              0
            ) + 1 || 0,
          availableSeats:
            classes.reduce(
              (total, current) => total + current.totalEnrolled,
              0
            ) - 1 || 0,
        },
      };

      const updatedResult = await classesCollection.updateMany(
        classesQuery,
        updateDoc,
        { upsert: true }
      );
      const enrolledResult = await enrollmentCollection.insertOne(
        newEnrollmentData
      );
      const deleteResult = await cartCollection.deleteMany(query);
      const paymentResult = await paymentCollection.insertOne(paymentInfo);

      res.send({ paymentResult, deleteResult, enrolledResult, updatedResult });
    });

    //GET: get payment history by email
    app.get("/payment-history/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userMail: email };
      const total = await paymentCollection.countDocuments(query);
      res.send(total);
    });

    //!--Enrolled Routes--!
    //GET: get popular classes
    app.get("/popular-classes", async (req, res) => {
      const result = await classesCollection
        .find()
        .sort({ totalEnrolled: -1 })
        .limit(6)
        .toArray();

      res.send(result);
    });

    //GET: get popular instructors
    app.get("/popular-instructors", async (req, res) => {
      const pipeline = [
        {
          $group: {
            _id: "$instructorName",
            totalEnrolled: { $sum: "$totalEnrolled" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "email",
            as: "instructor",
          },
        },
        {
          $project: {
            _id: 0,
            instructor: {
              $arrayElemAt: ["$instructor", 0],
            },
            totalEnrolled: 1,
          },
        },
        {
          $sort: { totalEnrolled: -1 },
        },
        {
          $limit: 6,
        },
      ];
      const result = await classesCollection.aggregate(pipeline).toArray();
      res.send(result);
    });

    //!--Admin Status--!
    //GET: get admin status
    app.get("/admin-stats", async (req, res) => {
      const approvedClasses = (
        await classesCollection.find({ status: "approved" }).toArray()
      ).length;
      const pendingClasses = (
        await classesCollection.find({ status: "pending" }).toArray()
      ).length;
      const instructors = (
        await userCollection.find({ role: "instructor" }).toArray()
      ).length;
      const totalClasses = (await classesCollection.find().toArray()).length;
      const totalEntrolled = (await enrollmentCollection.find().toArray())
        .length;

      const result = {
        approvedClasses,
        pendingClasses,
        instructors,
        totalClasses,
        totalEntrolled,
      };
      res.send(result);
    });

    //!--Instructor Route--!
    //Get: get all instructors
    app.get("/instructors", async (req, res) => {
      const result = await userCollection
        .find({ role: "instructor" })
        .toArray();
      res.send(result);
    });

    //GET: check if enrolled in class
    app.get("/enrolled-classes/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userMail: email };
      const pipeline = [
        {
          $match: query,
        },
        {
          $lookup: {
            from: "classes",
            localField: "classesId",
            foreignField: "_id",
            as: "classes",
          },
        },
        {
          $unwind: "$classes",
        },
        {
          $lookup: {
            from: "users",
            localField: "classes.instructorEmail",
            foreignField: "email",
            as: "instructor",
          },
        },
        {
          $project: {
            _id: 0,
            instructor: {
              $arrayElemAt: ["$instructor", 0],
            },
            classes: 1,
          },
        },
      ];

      const result = await enrollmentCollection.aggregate(pipeline).toArray();
      res.send(result);
    });

    //POST: applied for instructors
    app.post("/as-instructor", async (req, res) => {
      const data = req.body;
      const result = await appliedCollection.insertOne(data);
      res.send(result);
    });
    //GET: get applied instructors by email
    app.get("/applied-instructors/:email", async (req, res) => {
      const email = req.params.email;
      const result = await appliedCollection.findOne({ email });
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
