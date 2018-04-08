const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mongodb = require('mongodb');
const uuid = require('uuid/v4');

const app = new express();
let db;

// MODIFY THIS TO CHANGE THE GAME TYPE
/*----------------------------------*/
/**/const GAMETYPE = 'game2_train'; //
/*----------------------------------*/

const PORT = process.env.PORT || 3000;

mongodb.MongoClient.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/test", function (err, client) {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    // Save database object from the callback for reuse.
    db = client.db();
    console.log("Database connection ready");

    // Initialize the app.
    app.listen(PORT, () => {
        console.log('listening');
    });
});

const users = {};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, `instr_${GAMETYPE}.html`)));

app.get('/game', (req, res) => res.sendFile(path.join(__dirname, `${GAMETYPE}.html`)));

app.get('/questions', (req, res) => res.sendFile(path.join(__dirname, 'questions.html')));

app.post('/game', (req, res) => {
    const id = uuid();
    const obj = { id: id, plan: req.body.path.map(step => { return { action: step.Action, explain: step.explain } }), mapId: req.body.mapId, planTime: req.body.path.reduce((sum, step) => step.time ? sum + parseInt(step.time) : sum, 0), planSize: req.body.path.length };
    users[id] = obj;
    res.send(id);
});

app.post('/questions', (req, res) => {
    console.log(req.body.id);
    if (users[req.body.id]) {
        const obj = { id: req.body.id, mapId: users[req.body.id].mapId, plan: users[req.body.id].plan, planSize: users[req.body.id].planSize, planTime: users[req.body.id].planTime, answers: req.body.answers };
        console.log(obj);
        delete users[req.body.id];

        db.collection(GAMETYPE).insertOne(obj, (err, doc) => {
            if (err) throw err;
            res.send('Submission received');
        });
    }

});
