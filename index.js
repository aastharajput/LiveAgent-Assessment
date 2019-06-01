const request = require('request');
const WebSocket = require('ws');

const signupEndpoint = "https://va.idp.liveperson.net/api/account/13350576/signup";
const wsEndpoint = "wss://va.msg.liveperson.net/ws_api/account/13350576/messaging/consumer?v=3";

request.post(signupEndpoint,
	(error, res, body) => {
		if (error) {
			console.error(error)
			return
		}

		// On Success, statusCode must be equal to 200
		if(res.statusCode == 200) {
			let JWT = null;
			// Parse Body to Retrieve JWT

			const obj = JSON.parse(body);
			JWT = obj.jwt;

			console.log("Received JWT Token : ", JWT);

			// Step 2 
			let connectionHeaderObj = {
				"headers":{
					"Authorization": "jwt " + JWT
				}
			}
			const connection = new WebSocket(wsEndpoint,connectionHeaderObj);

			connection.onopen = () => {

				console.log("Connection Opened");

				//Requesting for Conversation Id
				connection.send(JSON.stringify({"kind":"req","id":1,"type":"cm.ConsumerRequestConversation"}));

			}

			connection.onmessage = response => {
				console.log(response.data);
				let responseDataObj = JSON.parse(response.data);

				if(responseDataObj.code == 200)
				{
					if(responseDataObj.type == "cm.RequestConversationResponse") {
						let conversationId = responseDataObj.body.conversationId;	
						console.log("Received conversation ID: ",conversationId);

						//Sending our 1st message
						let dataObj = {
							"kind":"req",
							"id":2,
							"type":"ms.PublishEvent",
							"body":{
								"dialogId":conversationId,    // Replacing _YOUR_CONVERSATION_ID_ with conversationId
								"event":{
									"type":"ContentEvent",
									"contentType":"text/plain",
									"message":"My first message"
								}
							}
						};
						//Publishing first message
						connection.send(JSON.stringify(dataObj));

					} else if (responseDataObj.type == "ms.PublishEventResponse"){
						console.log("Successfully published first message", "\nResponse", responseDataObj);
						console.log("Closing connection");
						connection.close();
					}
				}
				else {
					console.err('Invalid response Code: ',responseDataObj.code);
				}				
			}
		} else {
			console.err('Invalid statusCode: ',res.statusCode);
		}
	});

