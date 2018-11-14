const express = require('express');
const router = express.Router();
const config = require('config');
const path = require('path');

const mongodb = require('./libs/mongodb');
const { ObjectID } = require('mongodb');


router.get('/', (req, res) => {
	res.sendFile(path.join(__dirname,'index.html'));
});

router.get('/api/messages/single/:id', (req, res) => {
	let messageId = req.params.id;
	console.log(messageId);

	if(!ObjectID.isValid(messageId)) {
		return res.status(404).send({error: 'Invalid message id'});
	}
	let db = mongodb.get()
	db.db('chat').collection('messages').find({'_id': new ObjectID(messageId)}).toArray()
		.then((result) => {
			if(result == false) {
				return res.status(404).send({error: 'Message not found'});
			};

			res.status(200).send(result);
		}).catch((e) => {
			console.log(e)
			res.status(500).send({error: 'Internal Server Error'});
		});
});

router.get('/api/messages/list/:p([0-9]+)', (req, res) => {
	let p = req.params.p;
	let limit = config.messagesLimit;
	let skip = p * limit;

	let db = mongodb.get()
	db.db('chat').collection('messages').find().skip(skip).limit(limit).toArray()
		.then((result) => {
			if(result == false) {
				return res.status(404).send({error: 'Messages not found'});
			};

			res.status(200).send(result);
		}).catch((e) => {
			console.log(e)
			res.status(500).send({error: 'Internal Server Error'});
		});


});

router.post('/api/messages/', (req, res) => {
	console.log(req.body);
	let author = req.body.author;
	let message = req.body.message;

	function validateEmail(email) {
		let regEx = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return regEx.test(email);
	};

	function validateMessage(message) {
		let regEx = /^(?!\s*$).+|^[a-zA-Z]{100}$/;
		return regEx.test(message);	
	};

	if(!validateMessage(message)) {
		return res.status(400).send({error: 'Message must be less than 100 letters and not empty'});
	}

	if (!validateEmail(author)){
		return res.status(400).send({error: 'Invalid author email'});
	 };

	let msg = {
		author: author,
        message: message,
		createAt: new Date(),
		updateAt: new Date()
	};

	let db = mongodb.get()

	db.db('chat').collection('messages').insertOne(msg)
		.then((result) => {
			console.log('Massage saved: ', result.insertedId);
			res.status(200).send(result.insertedId);
			
		}).catch((e) => {
			console.log(e)
			res.status(500).send({error: 'Internal Server Error'});
		});


});

router.all('*', (req, res) => {
	res.status(404).send({error: '404 Not found'});
})

module.exports = router;