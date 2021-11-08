const { MongoClient } = require("mongodb");

let db;
async function connectDB() {
	const client = new MongoClient(process.env.DB_URL);

	try {
		await client.connect();
		db = client.db();
		console.log("DB connected");
	} catch (err) {
		console.log(err.message);
	}
}

function getUserCollection() {
	return db.collection("users");
}
function getPostCollection() {
	return db.collection("posts");
}

module.exports = {
	connectDB,
	getUserCollection,
	getPostCollection,
};
