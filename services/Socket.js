import {Server as SocketServer} from "socket.io";
import socketioJwt from "socketio-jwt";

const {JWT_SECRET} = process.env;

class Socket {
    static init = (server) => {
        this.io = new SocketServer(server, {
            cors: '*'
        });

        this.io.use(socketioJwt.authorize({
            secret: JWT_SECRET,
            handshake: true
        }));

        this.io.on('connect', this.#handleConnect);
    }

    static #handleConnect = async (client) => {

        const {adminId} = client.decoded_token;

        client.join(`admin_${adminId}`);
        client.on('disconnect', this.#handleDisconnect(adminId));
        console.log('connect');
    }

    static #handleDisconnect = (adminId) => async () => {
        this.io.emit('user-disconnect', { adminId });
        console.log('disconnect');
    }

    static emitAdmin = (adminIds, event, data = {}) => {
        adminIds.forEach(id => {
            this.io.to(`admin_${id}`).emit(event, data);
        })
    }
}

export default Socket;
