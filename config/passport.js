const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");
const { getUserCollection } = require("../modules/mongodb");

module.exports = (passport) => {
	async function authenticateUser(email, password, done) {
		// Match User
		const user = await getUserCollection().findOne({ email });
		if (!user)
			return done(null, false, {
				message: "No user with that email",
			});

		// Match Password
		bcrypt.compare(password, user.password, (err, isMatch) => {
			if (!isMatch)
				return done(null, false, {
					message: "Incorrect Password",
				});

			return done(null, user);
		});
	}

	passport.use(
		new LocalStrategy(
			{
				usernameField: "email",
				passwordField: "password",
			},
			authenticateUser
		)
	);

	// google strategy
	passport.use(
		new GoogleStrategy(
			{
				clientID: process.env.GOOGLE_CLIENT_ID,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET,
				callbackURL: "http://localhost:3001/auth/google/callback",
			},
			async function (accessToken, refreshToken, profile, done) {
				const user = await getUserCollection().findOne({
					googleId: profile.id,
				});
				if (user) return done(null, user);
				const userInfo = {
					username: profile.displayName,
					googleId: profile.id,
				};
				const newUser = await getUserCollection().insertOne(userInfo);

				return done(null, user);
			}
		)
	);

	// Create the session
	passport.serializeUser(function ({ _id }, done) {
		done(null, _id);
	});

	// Check the session
	passport.deserializeUser(async function (id, done) {
		const user = await getUserCollection().findOne({ _id: ObjectId(id) });
		done(null, {
			email: user.email,
			username: user.username,
			_id: user._id,
		});
	});
};
