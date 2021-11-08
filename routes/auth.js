const express = require("express");
const passport = require("passport");
const bcrypt = require("bcrypt");
const cors = require("cors");

const { AuthenticationError } = require("apollo-server-express");
const { getUserCollection } = require("../modules/mongodb");

const router = express.Router();
router.use(
	cors({
		origin: "http://localhost:3000",
		credentials: true,
	})
);

// handle register a user
router.post("/register", async (req, res) => {
	const { email, password, username } = req.body;

	if (!email || !password)
		return res.json({
			message: "Invalid inputs",
		});

	try {
		const user = await getUserCollection().findOne({ email });
		if (user) {
			return res.json({
				message: "User is already existed",
			});
		}

		// add the user
		const hashedPassword = await bcrypt.hashSync(password, 10);
		await getUserCollection().insertOne({
			...req.body,
			password: hashedPassword,
		});

		res.json({
			message: "User has been created",
		});
	} catch (err) {
		console.log(err.message);
	}
});

// handle login a user
router.post("/login", (req, res, next) => {
	passport.authenticate("local", (error, user, info) => {
		if (error) {
			return next(error);
		}
		if (!user) {
			return res.json({
				signedIn: false,
				errorMessage: info.message,
			});
		}
		req.logIn(user, function (err) {
			if (err) {
				return next(err);
			}
			return res.json({
				signedIn: true,
				email: user.email,
				username: user.username,
				id: user._id,
			});
		});
	})(req, res, next);
});

// login by google
router.get(
	"/google",
	passport.authenticate("google", {
		scope: ["profile"],
	})
);
router.get("/google/callback", passport.authenticate("google"), (req, res) => {
	res.send("<script>window.location.href = 'http://localhost:3000';</script>");
});

// handle logout a user
router.post("/logout", (req, res) => {
	req.logout();

	res.json({
		signedIn: false,
	});
});

// get the user
router.get("/user", (req, res) => {
	res.json(getUser(req));
});

function getUser(req) {
	if (!req.isAuthenticated()) return { signedIn: false };

	return {
		email: req.user.email,
		username: req.user.username,
		id: req.user._id,
		signedIn: true,
	};
}

function authedUserResolver(resolver) {
	return (root, args, { user }) => {
		if (!user || !user.signedIn) {
			throw new AuthenticationError("You must be signed in");
		}

		return resolver(root, args, { user });
	};
}

module.exports = { router, getUser, authedUserResolver };
