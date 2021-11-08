require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const initApollo = require("./config/apollo");
const { connectDB } = require("./modules/mongodb");
const auth = require("./routes/auth");

require("./config/passport")(passport);

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(session({ secret: "secret", resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// routes
app.use("/auth", auth.router);

const PORT = process.env.PORT || 3001;

initApollo(app);

(async function startServer() {
	try {
		await connectDB();

		app.listen(PORT, () =>
			console.log(
				process.env.NODE_ENV === "production" ? "" : `http://localhost:${PORT}`
			)
		);
	} catch (error) {}
})();
