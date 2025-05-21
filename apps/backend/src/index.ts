import { config } from "dotenv";
import { app } from "./app";
import connectDB from "@readium/database";
import { router as indexRouter } from "./routes/index.route";

config({
  path: "./.env", //env not loading if I don't use ./.env rather than ./env
});

connectDB();

app.use("/api/v1", indexRouter);

const port = process.env.PORT;

app.listen(port, () => {
  console.log("Server Running at Port: ", port);
});
