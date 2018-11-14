const socketIO = require('socket.io');
const mongodb = require('./mongodb');

function socket (server) {

    let io = socketIO(server);

    let db = mongodb.get();
    let users = [];
    let connections = [];

    io.on('connection', (socket) => {
        connections.push(socket);
        console.log('Connected: %s sockets connected', connections.length);
        
	  db.db('chat').collection('messages').find().toArray()
		.then((messages) => {
			if (messages) {
				socket.emit('chat history', messages);
			}
		}).catch(e => console.log(e));

		socket.on('disconnect', function(data) {
			users.splice(users.indexOf(socket.username), 1)
			updateUserList();
			connections.splice(connections.indexOf(socket), 1);
			console.log('Diconnected: %s sockets connected', connections.length);
		});

        socket.on('send message', (data) => {
			io.emit('new message', {msg: data, user: socket.authorEmail});

					let msg = {
						author: socket.authorEmail,
                        message: data,
						createAt: new Date(),
						updateAt: new Date()
					};

					db.db('chat').collection('messages').insertOne(msg)
						.then((result) => {
							console.log('Massage saved: ', result.insertedId); 

						}).catch(e => consoloe.log(e))

        });
        
        socket.on('new user', (data, callback) => {
			callback(true);
			socket.authorEmail = data;
			users.push(socket.authorEmail);
			updateUserList();
        });
        
        function updateUserList() {
			io.emit('get users', users);
		}

        
    });
};

module.exports = socket;
