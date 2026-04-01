const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectToDb = require('./db/db');
const captainRoutes = require('./routes/captain.routes');

const app = express();
const port = process.env.PORT || 3001;

connectToDb();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send('Captain Service is running');
});

app.use('/captains', captainRoutes);

app.listen(port, () => {
    console.log(`Captain Service listening at http://localhost:${port}`);
});
