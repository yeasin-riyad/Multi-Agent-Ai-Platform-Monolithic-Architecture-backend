import "./config/env.js";         
import app from "./app.js";
import connectDb from "./config/db.js";

const port = process.env.PORT || 8000;

app.listen(port, async () => {
  console.log(`🚀 Server started at ${port}`);
  await connectDb();
});