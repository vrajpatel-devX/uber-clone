const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectToDb = require('./db/db');
const rideRoutes = require('./routes/ride.routes');
const http = require('http');
const { initializeSocket } = require('./socket');

const app = express();
const port = process.env.PORT || 3003;

connectToDb();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const server = http.createServer(app);
initializeSocket(server);

app.get('/', (req, res) => {
    res.send('Ride Service is running');
});

app.use('/rides', rideRoutes);

server.listen(port, () => {
    console.log(`Ride Service listening at http://localhost:${port}`);
});
