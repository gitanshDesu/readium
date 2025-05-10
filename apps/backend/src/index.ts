import { config } from "dotenv";
import { app } from "./app";

config({
  path: "./env",
});

app.listen(process.env.PORT, () => {
  console.log("Server Running at Port: ", process.env.PORT);
});
