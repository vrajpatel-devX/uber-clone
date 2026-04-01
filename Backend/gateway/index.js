import 'dotenv/config';
import express from "express";
import httpProxy from "express-http-proxy";

const app = express();

app.use("/users", httpProxy(process.env.USER_SERVICE_URL));
app.use("/captains", httpProxy(process.env.CAPTAIN_SERVICE_URL));
app.use("/maps", httpProxy(process.env.MAP_SERVICE_URL));
app.use("/rides", httpProxy(process.env.RIDE_SERVICE_URL));

app.listen(3004, () => {
    console.log("Gateway running on port 3004");
}); 