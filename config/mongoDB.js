require("dotenv").config();
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
const connectDatabase = async () => {
  try {
    const conn = await mongoose.connect(process.env.DATABASE, {
      // Unnecessary, b/c it is default in mongoose 6
      //useUnifiedTopogy: true,
      //useNewUrlParser: true,
    });
    console.log(`DB connection successfully`);
  } catch (error) {
    console.error(`Error connection DB`);
    process.exit(1);
  }
};

module.exports = connectDatabase;
