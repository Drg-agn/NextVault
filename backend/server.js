require("dotenv").config();

console.log("ENV:", process.env.MONGO_URI); 

const app = require("./src/app");
const connectToDB = require("./src/config/db");

connectToDB();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("server is running on port " + PORT);
});