const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectToDb = require('./db/db');
const userRoutes = require('./routes/user.routes');

const app = express();
const port = process.env.PORT || 3000;

connectToDb();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/health-check', (req, res) => {
    res.send('User Service is running');
});

app.use('/', userRoutes);

app.listen(port, () => {
    console.log(`User Service listening at http://localhost:${port}`);
});
