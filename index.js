const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5144;
const fs = require("fs");
const FormData = require("form-data");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
	res.send("simple crud is running");
});

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { default: axios } = require("axios");
const uri =
	"mongodb+srv://mustafiz8260:BX58G1x7A189eFOO@bikroyelectroniscluster.9ujswdc.mongodb.net/?retryWrites=true&w=majority&appName=BikroyElectronisCluster";

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

		const database = client.db("UsersDB");
		const usersCollection = database.collection("users");
		const categoryCollection = database.collection("categoryCollection");
		const productsCollection = database.collection("productsCollection");
		const wishListCollection = database.collection("wishListCollection");

		// Category collections

		app.get("/categories", async (req, res) => {
			const cursor = categoryCollection.find();
			const result = await cursor.toArray();
			res.send(result);
		});

		app.post("/categories", async (req, res) => {
			const categories = req.body;
			const result = await categoryCollection.insertOne(categories);
			res.send(result);
		});

		//  Product  collections

		app.post("/products", async (req, res) => {
			const product = req.body;
			const result = await productsCollection.insertOne(product);
			res.send(result);
		});
		app.get("/products", async (req, res) => {
			const cursor = productsCollection.find();
			const result = await cursor.toArray();
			res.send(result);
		});

		app.get("/products/:id", async (req, res) => {
			const id = req.params.id;
			console.log(id);
			if (id) {
				const query = { _id: new ObjectId(id) };
				const result = await productsCollection.findOne(query);
				res.send(result);
			}
		});

		app.put('/products/update/:id' ,async(req , res) =>{
			const id = req.params.id
			const query = { _id: new ObjectId(id) };

			const updateProduct = req.body.data	
			console.log(id ,updateProduct)
			const result = await productsCollection.updateOne(query,  { $set: updateProduct });
			res.send(result)

			console.log(id ,updateProduct);
	  
	  
		  })


		//   Wishlist

		app.post("/wishlist", async (req, res) => {
			const wishListProduct = req.body;
			const query = { _id: wishListProduct._id };

			const checkProduct = await wishListCollection.findOne(query);
			console.log(checkProduct);

			if(!checkProduct){
				const result = await wishListCollection.insertOne(wishListProduct);
				res.send(result);
			}
			else{
				
				res.status(409).send({ message: "Product already exists in the wishlist" });			}
		});

		app.get("/wishlist", async (req, res) => {
			const email = req.query.email;
			const query = {email  : email }

			const cursor = wishListCollection.find(query);
			const result = await cursor.toArray();
			res.send(result);
		});


		app.get("/wishlist/:id", async (req, res) => {
			const email = req.query.email;
			const query = {email  : email }

			const cursor = wishListCollection.find(query);
			const result = await cursor.toArray();
			res.send(result);
		});


	  

		await client.db("admin").command({ ping: 1 });
		console.log(
			"Pinged your deployment. You successfully connected to MongoDB!"
		);
	} finally {
		// Ensures that the client will close when you finish/error
		// await client.close();
	}
}
run().catch(console.dir);

app.listen(port, () => {
	console.log(`simple crud is running on ${port}`);
});

// mustafiz8260
// BX58G1x7A189eFOO

// mongodb+srv://mustafiz8260:BX58G1x7A189eFOO@bikroyelectroniscluster.9ujswdc.mongodb.net/?retryWrites=true&w=majority&appName=BikroyElectronisCluster
