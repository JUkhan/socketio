
var cool = require('cool-ascii-faces');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var _ = require('lodash-node');
//var cors = require('cors');
var port = process.env.PORT || 5000;
var users = [];

//app.use(cors());
app.use(function(req, res, next) {
  console.log('---------cors------------');
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', function(req, res){
  console.log('----------------------');
  res.sendFile(__dirname + '/index.html');
});
app.get('/cool', function(request, response) {
  response.send(cool());
});

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    console.log('message: '+ msg);
    io.emit('chat message', msg);
  });
  socket.on('login', function (name) {
    // if this socket is already connected,
    // send a failed login message
    if (_.findIndex(users, { socket: socket.id }) !== -1) {
      socket.emit('login_error', 'You are already connected.');
    }

    // if this name is already registered,
    // send a failed login message
    if (_.findIndex(users, { name: name }) !== -1) {
      socket.emit('login_error', 'This name already exists.');
      return; 
    }

    users.push({ 
      name: name,
      socket: socket.id
    });

    socket.emit('login_successful', _.pluck(users, 'name'));
    socket.broadcast.emit('online', name);

    console.log(name + ' logged in');
  });

  socket.on('sendMessage', function (name, message) {
    var currentUser = _.find(users, { socket: socket.id });
    if (!currentUser) { return; }

    var contact = _.find(users, { name: name });
    if (!contact) { return; }
    
    io.to(contact.socket)
      .emit('messageReceived', currentUser.name, message);
  });

  socket.on('disconnect', function () {
    var index = _.findIndex(users, { socket: socket.id });
    if (index !== -1) {
      socket.broadcast.emit('offline', users[index].name);
      console.log(users[index].name + ' disconnected');

      users.splice(index, 1);
    }
  });
});

 http.listen(port, function(){
   console.log('listening on *:' + port);
 });
