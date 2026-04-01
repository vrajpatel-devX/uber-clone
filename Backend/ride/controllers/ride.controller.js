const rideService = require('../services/ride.service');
const { validationResult } = require('express-validator');
const axios = require('axios');
const { sendMessageToSocketId } = require('../socket');
const rideModel = require('../models/ride.model');

async function getRideWithUserAndCaptain(ride) {
    let rideWithDetails = ride.toObject ? ride.toObject() : ride;
    try {
        const userPromise = axios.get(`${process.env.USER_SERVICE_URL}/users/get-user-by-id/${ride.user}`);
        const captainPromise = ride.captain 
            ? axios.get(`${process.env.CAPTAIN_SERVICE_URL}/captains/get-captain-by-id/${ride.captain}`)
            : Promise.resolve({ data: null });

        const [userResponse, captainResponse] = await Promise.all([userPromise, captainPromise]);

        if (userResponse.data) {
            rideWithDetails.user = userResponse.data;
        }
        if (captainResponse.data) {
            rideWithDetails.captain = captainResponse.data;
        }
    } catch (err) {
        console.error("Error fetching user or captain data:", err.message);
    }
    return rideWithDetails;
}
module.exports.createRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { userId, pickup, destination, vehicleType } = req.body;

    try {
        const ride = await rideService.createRide({ user: req.user._id, pickup, destination, vehicleType, token: req.cookies.token || req.headers.authorization?.split(' ')[1] });

        const pickupCoordinatesResponse = await axios.get(`${process.env.MAP_SERVICE_URL}/maps/get-coordinates?address=${pickup}`, {
            headers: {
                Authorization: `Bearer ${req.cookies.token || req.headers.authorization?.split(' ')[1]}`
            }
        });

        const pickupCoordinates = pickupCoordinatesResponse.data;

        const captainsInRadiusResponse = await axios.get(`${process.env.MAP_SERVICE_URL}/maps/get-captains-in-radius?ltd=${pickupCoordinates.ltd}&lng=${pickupCoordinates.lng}&radius=2`, {
            headers: {
                Authorization: `Bearer ${req.cookies.token || req.headers.authorization?.split(' ')[1]}`
            }
        });

        const captainsInRadius = captainsInRadiusResponse.data;


        ride.otp = ""

        const rideDoc = await rideModel.findOne({ _id: ride._id });
        const rideWithUser = rideDoc.toObject();
        rideWithUser.user = req.user;

        captainsInRadius.map(captain => {

            sendMessageToSocketId(captain.socketId, {
                event: 'new-ride',
                data: rideWithUser
            })
        })

        return res.status(201).json(ride);

    } catch (err) {

        console.log(err);
        return res.status(500).json({ message: err.message });
    }

};

module.exports.getFare = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { pickup, destination } = req.query;

    try {
        const fare = await rideService.getFare(pickup, destination, req.cookies.token || req.headers.authorization?.split(' ')[1]);
        return res.status(200).json(fare);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

module.exports.confirmRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    console.log("okay1")
    const { rideId } = req.body;

    try {
        console.log("thia :", rideId)
        console.log("that is req captain", req.captain)
        const ride = await rideService.confirmRide({ rideId, captain: req.captain });
        const rideWithUser = await getRideWithUserAndCaptain(ride);

        console.log("socket id:", rideWithUser.user.socketId)
        console.log("ride with user and captain", rideWithUser)

        sendMessageToSocketId(rideWithUser.user.socketId, {
            event: 'ride-confirmed',
            data: rideWithUser
        })

        console.log("okay8")

        return res.status(200).json(rideWithUser);
    } catch (err) {

        console.log(err);
        return res.status(500).json({ message: err.message });
    }
}

module.exports.startRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    console.log("okay1")

    const { rideId, otp } = req.query;

    try {
        const ride = await rideService.startRide({ rideId, otp, captain: req.captain });
        const rideWithUser = await getRideWithUserAndCaptain(ride);
        console.log("okay2")
        console.log(rideWithUser);

        sendMessageToSocketId(rideWithUser.user.socketId, {
            event: 'ride-started',
            data: rideWithUser
        })

        return res.status(200).json(rideWithUser);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

module.exports.endRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId } = req.body;

    try {
        const ride = await rideService.endRide({ rideId, captain: req.captain });
        const rideWithUser = await getRideWithUserAndCaptain(ride);

        sendMessageToSocketId(rideWithUser.user.socketId, {
            event: 'ride-ended',
            data: rideWithUser
        })

        return res.status(200).json(rideWithUser);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}