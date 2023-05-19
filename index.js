const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 4000;

// middleware of express js
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.SECRET_USER}:${process.env.SECRET_PASS}@cluster0.lvw8wzq.mongodb.net/?retryWrites=true&w=majority`;

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
      client.connect();

      const database = client.db("tinyDriverDB");
      const carGalleryCollection = database.collection("toyCarGallery");
      const carsCollection = database.collection("tinyDriverCars");

      const index = await carsCollection.createIndex({ name: 1 }, { name: "toyName" });

      app.get("/car_gallery", async (req, res) => {
         const result = await carGalleryCollection.find({}).toArray();
         res.send(result);
      });

      app.get("/all_toys", async (req, res) => {
         const toysPerPage = 10;
         const currentPage = parseInt(req.query.page, 10) || 1;
         const allToysNum = await carsCollection.estimatedDocumentCount();
         const totalPages = Math.ceil(allToysNum / toysPerPage);
         const skip = (currentPage - 1) * toysPerPage;
         const text = req.query.search;
         if (text) {
            const query = await carsCollection
               .find({
                  name: { $regex: text, $options: "i" },
               })
               .toArray();

            const result = await carsCollection
               .find({
                  name: { $regex: text, $options: "i" },
               })
               .skip(skip)
               .limit(toysPerPage)
               .toArray();
            const toysCount = query.length || 1;

            return res.send({ totalPages: Math.ceil(toysCount / toysPerPage), toys: result });
         }
         const result = await carsCollection.find({}).skip(skip).limit(toysPerPage).toArray();
         res.send({ totalPages, toys: result });
      });

      app.get("/cars", async (req, res) => {
         const result = await carsCollection.find({}).toArray();
         res.send(result);
      });

      app.get("/car_details/:id", async (req, res) => {
         const id = req.params.id;
         console.log(id);
         const query = { _id: new ObjectId(id) };
         const result = await carsCollection.findOne(query);
         res.send(result);
      });

      app.get("/sub_category", async (req, res) => {
         const options = {
            projection: { sub_category: 1, _id: 0 },
         };
         const subCategories = await carsCollection.find({}, options).toArray();
         let subCategory = [];
         const categories = subCategories.map((category) => {
            if (!subCategory.includes(category.sub_category)) {
               subCategory.push(category.sub_category);
            }
         });
         res.send(subCategory);
      });

      app.get("/cars/:sCategory", async (req, res) => {
         const sCategory = req.params.sCategory;
         const query = { sub_category: sCategory };
         const result = await carsCollection.find(query).toArray();
         res.send(result);
      });

      // Send a ping to confirm a successful connection
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
   } finally {
      // Ensures that the client will close when you finish/error
      //   await client.close();
   }
}
run().catch(console.dir);

app.get("/", (req, res) => {
   res.send("Hello World!");
});

app.listen(port, () => {
   console.log(`Example app listening on port ${port}`);
});
