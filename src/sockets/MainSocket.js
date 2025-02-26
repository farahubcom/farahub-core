const { Socket } = require('@farahub/framework/foundation');


class MainSocket extends Socket {

    /**
     * The socket name
     * 
     * @var string
     */
    name = 'Main';

    /**
     * The socket events
     * 
     * @var array
     */
    events = [
        { event: 'authentication:login', handler: 'login' },
        //
    ];

    /**
     * Get list or user workspaces
     * 
     * @param {*} req request
     * @param {*} res response
     * 
     * @return void
     */
    login(socket) {
        return async function ({ user, workspace }) {
            socket.join("workspace:".concat(workspace.id));
        }
    }

    //
}

module.exports = MainSocket;