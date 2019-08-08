const mongodb = require("mongodb");
const mongo = mongodb.MongoClient;
const client = require("socket.io").listen(4000).sockets;

//connect to mongo

mongo.connect("mongodb://127.0.0.1/mongochat", function(err, db) {
  if (err) {
    throw err;
  }

  console.log("MongoDB connected...");

  //connect to socket.io

  client.on("connection", function(socket) {
    let chat = db.collection("chats");

    //Create function to send status

    sendStatus = function(s) {
      socket.emit("status", s);
    };

    //get chats from mongoCollection
    chat
      .find()
      .limit(100)
      .sort({ _id: 1 })
      .toArray(function(err, res) {
        if (err) throw err;

        //emit the messages
        socket.emit("output", res);
      });

    //handle input events
    socket.on("input", function(data) {
      let name = data.name;
      let message = data.message;

      //check for name and message
      if (name == "" || message == "") {
        //send error status
        sendStatus("Please Enter a name and message");
      } else {
        //Insert message in the database
        chat.insert({ name: name, message: message }, function() {
          client.emit("output", [data]);

          //send status update
          sendStatus({ message: "Message Sent", clear: true });
        });
      }
    });

    //Handle clear
    socket.on("clear", function(data) {
      //remove all data from the database
      chat.remove({}, function() {
        //Emit Cleared
        socket.emit("cleared");
      });
    });
  });
});
