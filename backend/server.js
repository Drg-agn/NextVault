require("dotenv").config();

console.log("ENV:", process.env.MONGO_URI); 

const app = require("./src/app");
const connectToDB = require("./src/config/db");

connectToDB();

app.listen(3000, () => {
    console.log("server is running on port 3000");
});