import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { handleSocketEvents } from './socket/socketHandler.js';
import authRoute from './routes/authRoute.js'
import boardRoute from './routes/boardRoute.js';
import cors from 'cors';



const app = express();

const server = createServer(app);
const io = new Server(server, {
    cors:{
        origin: '*',
        methods: ['GET', 'POST'],
        
    },
    connectionStateRecovery: {}
});


app.use(express.json());
app.use(cors());

//Routes
app.get('/', (req, res) => {
    res.send('Welcome to the API');
})

app.use('/api/auth', authRoute);
app.use('/api/boards', boardRoute);




io.on('connection', (socket) => handleSocketEvents(io, socket));





export {server, io};