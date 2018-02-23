const functions = require('firebase-functions');

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

function handleMediaEnd(app) {
  if (app.getMediaStatus() == app.Media.Status.FINISHED) {
    //response if audio finished playing
  } else { //"STATUS_UNSPECIFIED"
    //response if audio did not finish playing
  }
}

let actionMap = new Map();
actionMap.set(app.StandardIntents.MAIN, mainIntent);
actionMap.set(app.StandardIntents.MEDIA_STATUS, mediaStatus); //"actions.intent.MEDIA_STATUS"
app.handleRequest(actionMap);

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
