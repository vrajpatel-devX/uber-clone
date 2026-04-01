const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectToDb = require('./db/db');
const mapsRoutes = require('./routes/maps.routes');

const app = express();
const port = process.env.PORT || 3002;

connectToDb();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send('Map Service is running');
});

app.use('/maps', mapsRoutes);

app.listen(port, () => {
    console.log(`Map Service listening at http://localhost:${port}`);
});
