const express = require('express');
const app = express();
const server = require('http').Server(app);
const config = require('config');
const port = config.port;
const morgan = require('morgan');
const socket = require('./libs/socket');
const path = require('path');
const cluster = require('cluster');


const mongodb = require('./libs/mongodb');


const bodyParser = require('body-parser');

if (cluster.isMaster) {
	let numCPUs = require('os').cpus().length;
	console.log(`Master ${process.pid} is running`);

	for (let i = 0; i <numCPUs; i += 1) {
		cluster.schedulingPolicy = cluster.SCHED_NONE;
		cluster.fork();
	};

	cluster.on('exit', (worker) => {
		console.log(`worker ${worker.process.pid} died`);
		cluster.fork();
	});

} else {

	app.use(bodyParser.urlencoded({extended: false}));
	app.use(bodyParser.json());

	app.use(express.static(__dirname + '/public'));

	const favicon = require('serve-favicon');
	app.use(favicon(path.join(__dirname, 'public','favicon.png')));

	app.use(morgan('tiny'));

	app.disable('etag');

	mongodb.connect()
		.then(() => {
			server.listen(port, () => {
				console.log(`app is listening on port ${port}`);
				socket(server)
			});

		}).catch((e) => {
			console.log(e);
			process.exit(1)
		});

	app.use(require('./routes'));

	app.use((err, req, res, next) => {
		res.status(500).send({error: "Internal server error"})
	});

}
