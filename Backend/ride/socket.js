const socketIo = require('socket.io');
const axios = require('axios');

let io;

function initializeSocket(server) {
    io = socketIo(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);


        socket.on('join', async (data) => {
            const { userId, userType } = data;

            if (userType === 'user') {
                await axios.post(`${process.env.USER_SERVICE_URL}/users/update-socket-id`, {
                    userId,
                    socketId: socket.id
                })
            } else if (userType === 'captain') {
                await axios.post(`${process.env.CAPTAIN_SERVICE_URL}/captains/update-socket-id-location`, {
                    userId,
                    socketId: socket.id
                })
            }
        });


        socket.on('update-location-captain', async (data) => {
            const { userId, location } = data;

            if (!location || !location.ltd || !location.lng) {
                return socket.emit('error', { message: 'Invalid location data' });
            }

            await axios.post(`${process.env.CAPTAIN_SERVICE_URL}/captains/update-socket-id-location`, {
                userId,
                location: {
                    ltd: location.ltd,
                    lng: location.lng
                }
            })
        });

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
}

const sendMessageToSocketId = (socketId, messageObject) => {

    console.log(messageObject);

    if (io) {
        io.to(socketId).emit(messageObject.event, messageObject.data);
    } else {
        console.log('Socket.io not initialized.');
    }
}

module.exports = { initializeSocket, sendMessageToSocketId };