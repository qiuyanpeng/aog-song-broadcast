// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

'use strict';

const functions = require('firebase-functions'); // Cloud Functions for Firebase library
const DialogflowApp = require('actions-on-google').DialogflowApp; // Google Assistant helper library

const mediaResponseTemplate = `
  {
    "conversationToken": "{}",
    "expectUserResponse": $continueConversation,
    "expectedInputs": [{
      "possibleIntents": [{"intent": "assistant.intent.action.TEXT"}],
      "inputPrompt": {
        "richInitialPrompt": {
          "items": [{
            "simpleResponse": {
              "textToSpeech": "$songName from $author"
            }
          }, {
            "mediaResponse": {
              "mediaType": "AUDIO",
              "mediaObjects": [{
                "name": "$songName",
                "description": "$comments",
                "large_image": {
                  "url": "$imageUrl"
                },
                "contentUrl": "$songUrl"
              }]
            }
          }],
          "suggestions": [
            {"title": "Play another"},
            {"title": "Share this song"}
          ]
        }
      }
    }]
  }
  `;

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
  if (request.body.result) {
    processV1Request(request, response);
  } else if (request.body.queryResult) {
    processV2Request(request, response);
  } else {
    console.log('Invalid Request');
    return response.status(400).end('Invalid Webhook Request (expecting v1 or v2 webhook request)');
  }
});

/*
* Function to handle the event when one media play finishes.
*/
function handleMediaEnd(app) {
  if (app.getMediaStatus() == app.Media.Status.FINISHED) {
    //response if audio finished playing
  } else { //"STATUS_UNSPECIFIED"
    //response if audio did not finish playing
  }
}

/*
* Function to handle v1 webhook requests from Dialogflow
*/
function processV1Request (request, response) {
  let action = request.body.result.action; // https://dialogflow.com/docs/actions-and-parameters
  let parameters = request.body.result.parameters; // https://dialogflow.com/docs/actions-and-parameters
  let inputContexts = request.body.result.contexts; // https://dialogflow.com/docs/contexts
  let requestSource = (request.body.originalRequest) ? request.body.originalRequest.source : undefined;
  const googleAssistantRequest = 'google'; // Constant to identify Google Assistant requests
  const app = new DialogflowApp({request: request, response: response});
  // Create handlers for Dialogflow actions as well as a 'default' handler
  const actionHandlers = {
    // The default welcome intent has been matched, welcome the user (https://dialogflow.com/docs/events#default_welcome_intent)
    'input.welcome': () => {
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
      if (requestSource === googleAssistantRequest) {
        sendGoogleResponse('Hello, Welcome to my Dialogflow agent!'); // Send simple response to user
      } else {
        sendResponse('Hello, Welcome to my Dialogflow agent!'); // Send simple response to user
      }
    },
    'input.send_song': () => {
      console.log('input.send_song is called');
      let name = app.getArgument('given-name');
      let song = app.getArgument('song');
      if (song) {
        app.tell(`name is ${given-name} and song is ${song}`);
        // TODO(qyp): find the song
      } else {
        app.tell(`name is ${given-name} and song is random`);
        // TODO(qyp): get a song
      }
      // TODO(qyp): Send a push
    },
    // The default fallback intent has been matched, try to recover (https://dialogflow.com/docs/intents#fallback_intents)
    'input.unknown': () => {
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
      if (requestSource === googleAssistantRequest) {
        sendGoogleResponse('I\'m having trouble, can you try that again?'); // Send simple response to user
      } else {
        sendResponse('I\'m having trouble, can you try that again?'); // Send simple response to user
      }
    },
     // When the user wants to get subsribed to daily updates. If the user is on a device with screen,
     // then directly register for updates, else handoff to a device with screen.
    'input.check_surface': () => {
        console.log('Nancy: in input.check_surface');
        let currentDeviceHasScreen = app.hasSurfaceCapability(app.SurfaceCapabilities.SCREEN_OUTPUT)
        if (!currentDeviceHasScreen) {
            console.log('Nancy: Current Device does not have screen');
            let context = 'Sure, I can send you updates.';
            let notif = 'Sample Update';
            let screenAvailable = app.hasAvailableSurfaceCapabilities(app.SurfaceCapabilities.SCREEN_OUTPUT);
            if (screenAvailable) {
                console.log('Nancy: User has a screen');
                app.askForNewSurface(context, notif, [app.SurfaceCapabilities.SCREEN_OUTPUT]);
            } else {
                console.log('Nancy: User does not have a device with screen');
                app.tell("Sorry, you need a screen to see updates");
            };        
        } else {
            console.log('Nancy: Current Device has screen');
            // Call Register Updates.
        }
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
    //   let responseToUser = {
    //     //data: richResponsesV1, // Optional, uncomment to enable
    //     //outputContexts: [{'name': 'weather', 'lifespan': 2, 'parameters': {'city': 'Rome'}}], // Optional, uncomment to enable
    //     speech: 'This message is from Dialogflow\'s Cloud Functions for Firebase editor!', // spoken response
    //     text: 'This is from Dialogflow\'s Cloud Functions for Firebase editor! :-)', // displayed response
    //     data: richResponsesV1
    //   };
    //   sendResponse(responseToUser);
    },
    // Handle the new surface response.
    'input.new_surface_response': () => {
        console.log('Nancy: in input.new_surface_response. Bye');
        if (app.isNewSurface()) {
            app.tell('Thanks for accepting');
        } else {
            app.tell('Ok, I understand. You don\'t want to switch devices. Bye');
        }
    },
    // Default handler for unknown or undefined actions
    'default': () => {
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
      if (requestSource === googleAssistantRequest) {
        let responseToUser = {
          //googleRichResponse: googleRichResponse, // Optional, uncomment to enable
          //googleOutputContexts: ['weather', 2, { ['city']: 'rome' }], // Optional, uncomment to enable
          speech: 'This message is from Dialogflow\'s Cloud Functions for Firebase editor!', // spoken response
          text: 'This is from Dialogflow\'s Cloud Functions for Firebase editor! :-)' // displayed response
        };
        sendGoogleResponse(responseToUser);
      } else {
        let responseToUser = {
          //data: richResponsesV1, // Optional, uncomment to enable
          //outputContexts: [{'name': 'weather', 'lifespan': 2, 'parameters': {'city': 'Rome'}}], // Optional, uncomment to enable
          speech: 'This message is from Dialogflow\'s Cloud Functions for Firebase editor!', // spoken response
          text: 'This is from Dialogflow\'s Cloud Functions for Firebase editor! :-)' // displayed response
        };
        sendResponse(responseToUser);
      }
    }
  };
  // If undefined or unknown action use the default handler
  if (!actionHandlers[action]) {
    action = 'default';
  }
  // Run the proper handler function to handle the request from Dialogflow
  actionHandlers[action]();
    // Function to send correctly formatted Google Assistant responses to Dialogflow which are then sent to the user
  function sendGoogleResponse (responseToUser) {
    if (typeof responseToUser === 'string') {
      app.ask(responseToUser); // Google Assistant response
    } else {
      // If speech or displayText is defined use it to respond
      let googleResponse = app.buildRichResponse().addSimpleResponse({
        speech: responseToUser.speech || responseToUser.displayText,
        displayText: responseToUser.displayText || responseToUser.speech
      });
      // Optional: Overwrite previous response with rich response
      if (responseToUser.googleRichResponse) {
        googleResponse = responseToUser.googleRichResponse;
      }
      // Optional: add contexts (https://dialogflow.com/docs/contexts)
      if (responseToUser.googleOutputContexts) {
        app.setContext(...responseToUser.googleOutputContexts);
      }
      console.log('Response to Dialogflow (AoG): ' + JSON.stringify(googleResponse));
      app.ask(googleResponse); // Send response to Dialogflow and Google Assistant
    }
  }
  // Function to send correctly formatted responses to Dialogflow which are then sent to the user
  function sendResponse (responseToUser) {
    // if the response is a string send it as a response to the user
    if (typeof responseToUser === 'string') {
      let responseJson = {};
      responseJson.speech = responseToUser; // spoken response
      responseJson.displayText = responseToUser; // displayed response
      response.json(responseJson); // Send response to Dialogflow
    } else {
      // If the response to the user includes rich responses or contexts send them to Dialogflow
      let responseJson = {};
      // If speech or displayText is defined, use it to respond (if one isn't defined use the other's value)
      responseJson.speech = responseToUser.speech || responseToUser.displayText;
      responseJson.displayText = responseToUser.displayText || responseToUser.speech;
      // Optional: add rich messages for integrations (https://dialogflow.com/docs/rich-messages)
      responseJson.data = responseToUser.data;
      // Optional: add contexts (https://dialogflow.com/docs/contexts)
      responseJson.contextOut = responseToUser.outputContexts;
      console.log('Response to Dialogflow: ' + JSON.stringify(responseJson));
      response.json(responseJson); // Send response to Dialogflow
    }
  }
  console.log('Nancy: Dialogflow Response: ' + JSON.stringify(response.body));
}
// Construct rich response for Google Assistant (v1 requests only)
const app = new DialogflowApp();
const googleRichResponse = app.buildRichResponse()
  .addSimpleResponse('This is the first simple response for Google Assistant')
  .addSuggestions(
    ['Suggestion Chip', 'Another Suggestion Chip'])
    // Create a basic card and add it to the rich response
  .addBasicCard(app.buildBasicCard(`This is a basic card.  Text in a
 basic card can include "quotes" and most other unicode characters
 including emoji 📱.  Basic cards also support some markdown
 formatting like *emphasis* or _italics_, **strong** or __bold__,
 and ***bold itallic*** or ___strong emphasis___ as well as other things
 like line  \nbreaks`) // Note the two spaces before '\n' required for a
                        // line break to be rendered in the card
    .setSubtitle('This is a subtitle')
    .setTitle('Title: this is a title')
    .addButton('This is a button', 'https://assistant.google.com/')
    .setImage('https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
      'Image alternate text'))
  .addSimpleResponse({ speech: 'This is another simple response',
    displayText: 'This is the another simple response 💁' });

const richResponsesV1 = {
  'google': {
    'expectUserResponse': true,
    'isSsml': false,
    'systemIntent': {
      'intent': 'actions.intent.LINK',
      'data': {
        '@type': 'type.googleapis.com/google.actions.v2.LinkValueSpec',
        'open_url_action': {
          'url': 'https://amp-prototype-185115.appspot.com/fandango/movie/bladerunner2049/theater/regalbatterypark/buy/2017-11-02T15:55:00'
        },
        'dialogSpec': {
          'extension': {
            '@type': 'type.googleapis.com/google.actions.v2.LinkValueSpec.LinkDialogSpec',
            'confirmationPrompt': 'For that, I will handoff to fandango.com.',
            'destinationName': 'Fandango',
            'require_confirmation': true
          }
        } 
      }
    }
  }
};
