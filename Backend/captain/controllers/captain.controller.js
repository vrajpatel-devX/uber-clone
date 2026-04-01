const captainModel = require('../models/captain.model');
const captainService = require('../services/captain.service');
const blackListTokenModel = require('../models/blacklistToken.model');
const { validationResult } = require('express-validator');


module.exports.registerCaptain = async (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { fullname, email, password, vehicle } = req.body;

    const isCaptainAlreadyExist = await captainModel.findOne({ email });

    if (isCaptainAlreadyExist) {
        return res.status(400).json({ message: 'Captain already exist' });
    }


    const hashedPassword = await captainModel.hashPassword(password);

    const captain = await captainService.createCaptain({
        firstname: fullname.firstname,
        lastname: fullname.lastname,
        email,
        password: hashedPassword,
        color: vehicle.color,
        plate: vehicle.plate,
        capacity: vehicle.capacity,
        vehicleType: vehicle.vehicleType
    });

    const token = captain.generateAuthToken();

    res.status(201).json({ token, captain });

}

module.exports.loginCaptain = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const captain = await captainModel.findOne({ email }).select('+password');

    if (!captain) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await captain.comparePassword(password);

    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = captain.generateAuthToken();

    res.cookie('token', token);

    res.status(200).json({ token, captain });
}

module.exports.getCaptainProfile = async (req, res, next) => {
    res.status(200).json({ captain: req.captain });
}

module.exports.logoutCaptain = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[ 1 ];

    await blackListTokenModel.create({ token });

    res.clearCookie('token');

    res.status(200).json({ message: 'Logout successfully' });
}

module.exports.updateSocketIdLocation = async (req, res, next) => {
    try {
        const { userId, socketId, location } = req.body;
        const updateData = {};
        if (socketId) updateData.socketId = socketId;
        if (location) updateData.location = location;

        await captainModel.findByIdAndUpdate(userId, updateData);
        res.status(200).json({ message: 'SocketId and location updated' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}


module.exports.getCaptainsInTheRadius = async (req, res, next) => {
    try {
        const { ltd, lng, radius } = req.query;
        const captains = await captainService.getCaptainsInTheRadius(ltd, lng, radius);
        res.status(200).json(captains);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports.getCaptainById = async (req, res, next) => {
    try {
        const captain = await captainModel.findById(req.params.id);
        if (!captain) {
             return res.status(404).json({ message: 'Captain not found' });
        }
        res.status(200).json(captain);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
