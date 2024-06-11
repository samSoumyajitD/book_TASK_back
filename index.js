const express = require('express');
const cors = require('cors'); // Add this line
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors()); // Add this line to enable CORS
app.use(express.json());

const uri = "mongodb+srv://book-db:book123@cluster0.q4izil8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let bookCollections;

async function run() {
  try {
    await client.connect();
    bookCollections = client.db("BookInventory").collection("Books");
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
  }
}
run().catch(console.dir);

app.post("/upload-book", async (req, res) => {
  const data = req.body;
  if (!data.authorName || !data.imageURL || !data.category || !data.bookDescription || !data.bookTitle || !data.bookPdfUrl) {
    return res.status(400).send({ error: 'All fields are required' });
  }
  try {
    const result = await bookCollections.insertOne(data);
    res.status(201).send(result);
  } catch (error) {
    console.error("Error inserting book into MongoDB", error);
    res.status(500).send({ error: 'Failed to insert book' });
  }
});

app.get("/all-books", async (req, res) => {
  let query = {};
  if (req.query?.category) {
    query = { category: req.query.category }
  }
  const result = await bookCollections.find(query).toArray();
  res.send(result);
});
app.get("/search-books", async (req, res) => {
  const query = req.query.query;
  const regex = new RegExp(query, 'i'); // Case-insensitive search
  const result = await bookCollections.find({ bookTitle: regex }).toArray();
  res.send(result);
});

app.patch("/book/:id", async (req, res) => {
  const id = req.params.id;
  const updateBookData = req.body;
  const filter = { _id: new ObjectId(id) };
  const updatedDoc = { $set: { ...updateBookData } };
  const options = { upsert: true };
  const result = await bookCollections.updateOne(filter, updatedDoc, options);
  res.send(result);
});

app.delete("/book/:id", async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const result = await bookCollections.deleteOne(filter);
  res.send(result);
});

app.get("/book/:id", async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const result = await bookCollections.findOne(filter);
  res.send(result)
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
