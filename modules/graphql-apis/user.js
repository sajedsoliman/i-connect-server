const { UserInputError } = require("apollo-server-express");
const { getUserCollection } = require("../mongodb");
const { ObjectId } = require("mongodb");
const { authedUserResolver } = require("../../routes/auth");

async function get(_, { id }) {
	const user = await getUserCollection().findOne({ _id: ObjectId(id) });

	return user;
}

module.exports = {
	get: authedUserResolver(get),
};
