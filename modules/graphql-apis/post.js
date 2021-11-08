const { UserInputError } = require("apollo-server-express");
const { getPostCollection } = require("../mongodb");
const { ObjectId } = require("mongodb");
const { authedUserResolver } = require("../../routes/auth");

async function list(_, { pageNumber, limit }) {
	let skip = 0;

	if (pageNumber && limit) {
		skip = (pageNumber - 1) * limit;
	}

	const posts = await getPostCollection()
		.find()
		.skip(skip)
		.limit(limit)
		.toArray();
	// const count = await getPostCollection().countDocuments();

	return posts;
}

async function listCount() {
	const count = await getPostCollection().countDocuments();

	return count;
}

function validatePost(post) {
	const errors = {};

	if (post.body.length < 10) {
		errors.body = "Body must not be al least 10 characters";
	}
	if (post.author.length == 0) {
		errors.author = "Author must be provided";
	}

	if (Object.keys(errors).length > 0)
		throw new UserInputError("Invalid input(s)", { errors });
}

async function add(_, { post }) {
	validatePost(post);

	post.createdDate = new Date();
	post.likes = [];

	const newPost = await getPostCollection().insertOne(post);

	return await getPostCollection().findOne({
		_id: ObjectId(newPost.insertedId),
	});
}

async function update(_, { id, body }) {
	const updatedPost = await getPostCollection().updateOne(
		{ _id: ObjectId(id) },
		{ $set: { body } }
	);

	return await getPostCollection().findOne({ _id: ObjectId(id) });
}

async function toggleLike(_, { id, likerId, liker }) {
	const post = await getPostCollection().findOne({ _id: ObjectId(id) });
	const isAlreadyLiked = post.likes.find((liker) => liker.id === likerId);

	const updatedPost = await getPostCollection().updateOne(
		{ _id: ObjectId(id) },
		isAlreadyLiked
			? { $pull: { likes: { id: likerId } } }
			: { $push: { likes: { id: likerId, liker: liker } } }
	);

	return await getPostCollection().findOne({ _id: ObjectId(id) });
}

async function remove(_, { id }) {
	const deletePost = await getPostCollection().deleteOne({ _id: ObjectId(id) });

	return { _id: id };
}

async function get(_, { id }) {
	const post = await getPostCollection().findOne({ _id: ObjectId(id) });

	return post;
}

module.exports = {
	list: authedUserResolver(list),
	listCount: authedUserResolver(listCount),
	add: authedUserResolver(add),
	delete: authedUserResolver(remove),
	get: authedUserResolver(get),
	update: authedUserResolver(update),
	toggleLike: authedUserResolver(toggleLike),
};
