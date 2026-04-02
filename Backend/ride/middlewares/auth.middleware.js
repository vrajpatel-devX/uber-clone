const axios = require('axios');

module.exports.authUser = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[ 1 ];

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        
        const response = await axios.get(`${process.env.USER_SERVICE_URL}/profile`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const user = response.data;

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        req.user = user;
        console.log("pass middleware")
        return next();

    } catch (err) {
        res.status(401).json({ message: 'Unauthorized' });
    }
}

module.exports.authCaptain = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[ 1 ];

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const response = await axios.get(`${process.env.CAPTAIN_SERVICE_URL}/profile`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const captain = response.data.captain;

        if (!captain) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        req.captain = captain;

        return next();
    } catch (err) {
        res.status(401).json({ message: 'Unauthorized' });
    }
}
