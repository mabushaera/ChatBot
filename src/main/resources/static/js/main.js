'use strict';

var usernamePage = document.querySelector('#username-page');
var chatPage = document.querySelector('#chat-page');
var usernameForm = document.querySelector('#usernameForm');
var messageForm = document.querySelector('#messageForm');
var doNotDisturbForm = document.querySelector('#doNotDisturbForm');
var messageInput = document.querySelector('#message');
var messageArea = document.querySelector('#messageArea');
var connectingElement = document.querySelector('.connecting');

var stompClient = null;
var username = null;

var colors = [
	'#2196F3', '#32c787', '#00BCD4', '#ff5652',
	'#ffc107', '#ff85af', '#FF9800', '#39bbb0'
];

var u = []
function connect(event) {
	username = document.querySelector('#name').value.trim();
	u.push(username)
	if (username) {
		usernamePage.classList.add('hidden');
		chatPage.classList.remove('hidden');

		var socket = new SockJS('/ws');
		stompClient = Stomp.over(socket);

		stompClient.connect({}, onConnected, onError);
	}
	event.preventDefault();
}


function onConnected() {
	// Subscribe to the Public Topic
	stompClient.subscribe('/topic/public', onMessageReceived);

	// Tell your username to the server
	stompClient.send("/app/chat.addUser",
		{},
		JSON.stringify({ sender: username, type: 'JOIN' })
	)

	connectingElement.classList.add('hidden');
}


function onDoNotDis() {

	//alert(2);

	username = document.querySelector('#name').value.trim();
	// remove user
	const index = u.indexOf(username);
	if (index > -1) { // only splice array when item is found
		u.splice(index, 1); // 2nd parameter means remove one item only
	}

	// Tell your username to the server
	stompClient.send("/app/chat.doNotDis",
		{},
		JSON.stringify({ sender: username, type: 'DO_NOT_DISTURB' })
	)

	connectingElement.classList.add('hidden');
}


function onError(error) {
	connectingElement.textContent = 'Could not connect to WebSocket server. Please refresh this page to try again!';
	connectingElement.style.color = 'red';
}


function sendMessage(event) {
	var messageContent = messageInput.value.trim();

	if (messageContent && stompClient) {
		var chatMessage = {
			sender: username,
			content: messageInput.value,
			type: 'CHAT'
		};

		stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
		messageInput.value = '';
	}
	event.preventDefault();
}


function sendMessageDoNotDisturb(event) {
	//var messageContent = messageInput.value.trim();
	//alert(1)

	if (stompClient) {
		var chatMessage = {
			sender: username,
			content: 'Do Not Disturb!',
			type: 'DO_NOT_DISTURB'
		};

		stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
		messageInput.value = '';
		onDoNotDis();
	}
	event.preventDefault();
}

function onMessageReceived(payload) {
	var message = JSON.parse(payload.body);

	var messageElement = document.createElement('li');

	if (message.type === 'JOIN') {
		messageElement.classList.add('event-message');
		message.content = message.sender + ' joined!';
	} else if (message.type === 'LEAVE') {
		messageElement.classList.add('event-message');
		message.content = message.sender + ' left!';
	} else if (message.type === 'DO_NOT_DISTURB') {
		messageElement.classList.add('event-message');
		message.content = message.sender + 'Do Not Disturb!';
	}
	else {
		
		let i = 0;
		
		while (i < u.length) {
		
			if (u[i] == username) {
		
				messageElement.classList.add('chat-message');
		
				var avatarElement = document.createElement('i');
				var avatarText = document.createTextNode(message.sender[0]);
				avatarElement.appendChild(avatarText);
				avatarElement.style['background-color'] = getAvatarColor(message.sender);

				messageElement.appendChild(avatarElement);

				var usernameElement = document.createElement('span');
				var usernameText = document.createTextNode(message.sender);
				usernameElement.appendChild(usernameText);
				messageElement.appendChild(usernameElement);
		
			}
			i++;
		
		}
		
	}

	
	let i = 0;
	while (i < u.length) {
	
		if (u[i] == username) {
	
			var textElement = document.createElement('p');
			var messageText = document.createTextNode(message.content);
			textElement.appendChild(messageText);

			messageElement.appendChild(textElement);

			messageArea.appendChild(messageElement);
			messageArea.scrollTop = messageArea.scrollHeight;
		}
		i++;
	}
}


function getAvatarColor(messageSender) {
	var hash = 0;
	for (var i = 0; i < messageSender.length; i++) {
		hash = 31 * hash + messageSender.charCodeAt(i);
	}

	var index = Math.abs(hash % colors.length);
	return colors[index];
}

usernameForm.addEventListener('submit', connect, true)
messageForm.addEventListener('submit', sendMessage, true)
doNotDisturbForm.addEventListener('submit', sendMessageDoNotDisturb, true)
