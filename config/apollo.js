const fs = require("fs");
const { ApolloServer, UserInputError } = require("apollo-server-express");
const auth = require("../routes/auth");
const { getUserCollection } = require("../modules/mongodb");
const { GraphQLScalarType } = require("graphql");
const { Kind } = require("graphql/language");
const post = require("../modules/graphql-apis/post");
const user = require("../modules/graphql-apis/user");

// custom scalar types
const DateType = new GraphQLScalarType({
	name: "DateType",
	description: "A Date() type in GraphQL as a scalar",
	serialize(value) {
		return value.toISOString();
	},
	parseLiteral(ast) {
		if (ast.kind === Kind.STRING) {
			const date = new Date(ast.value);
			return isNaN(date) ? undefined : date;
		}
	},
	parseValue(value) {
		const date = new Date(value);

		if (isNaN(date)) {
			throw new UserInputError("invalid date", {
				errors: {
					date: "Date is invalid",
				},
			});
		} else return date;
	},
});

const resolvers = {
	Query: {
		postList: post.list,
		postListCount: post.listCount,
		user: user.get,
		getPost: post.get,
	},
	Mutation: {
		addPost: post.add,
		deletePost: post.delete,
		updatePost: post.update,
		toggleLike: post.toggleLike,
	},
	// scalar types
	DateType,
};

const server = new ApolloServer({
	typeDefs: fs.readFileSync("./config/schema.graphql", "utf-8"),
	resolvers,
	context: getContext,
	playground: true,
	introspection: true,
});

function getContext({ req }) {
	const user = auth.getUser(req);

	return { user };
}

async function initApollo(app) {
	// const enableCORS = (process.env.ENABLE_CORS || "true") == "true";
	await server.start();
	server.applyMiddleware({
		app,
		path: "/graphql",
		cors: {
			methods: "POST",
			origin: "http://localhost:3000",
			credentials: true,
		},
	});
}

module.exports = initApollo;
