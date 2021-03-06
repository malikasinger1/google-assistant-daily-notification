// process.env.DEBUG = 'actions-on-google:*';
import * as functions from 'firebase-functions';
const { DialogflowApp } = require('actions-on-google');

const Actions = {
  UNRECOGNIZED_DEEP_LINK: 'deeplink.unknown',
  FINISH_UPDATE_SETUP: 'finish.update.setup',
};
const Parameters = {
  CATEGORY: 'category',
  UPDATE_INTENT: 'UPDATE_INTENT'
};

const DAILY_NOTIFICATION_ASKED = 'daily_notification_asked';
const PUSH_NOTIFICATION_ASKED = 'push_notification_asked';

export const webhook = functions.https.onRequest((request, response) => {
  try {
    const app = new DialogflowApp({ request, response });

    console.log('Request headers: ' + JSON.stringify(request.headers));
    console.log('Request body: ' + JSON.stringify(request.body));

    // Map of action from Dialogflow to handling function
    const actionMap = new Map();

    actionMap.set(app.StandardIntents.CONFIGURE_UPDATES, configureUpdates);
    actionMap.set(Actions.FINISH_UPDATE_SETUP, finishUpdateSetup);

    actionMap.set("welcome", welcome);
    actionMap.set("whatMissed", whatMissed);
    actionMap.set("what_did_i_missed.what_did_i_missed-yes", whatMissed_yes);

    app.handleRequest(actionMap);

  } catch (e) {
    console.log("catch error: ", e)
  }
});



function welcome(app) {

  app.ask(app.buildRichResponse()
    .addSimpleResponse({
      speech:
        `<speak>
            <s> Hi, I'm you medication assistant </s>
        </speak>`
    })
  )
}

// Start opt-in flow for daily updates
function configureUpdates(app) {
  console.log("====>> configure triggered1")

  const intent = app.getArgument('UPDATE_INTENT');
  console.log("#####  INTENT: ", intent);

  const category = app.getArgument('notification-category');
  console.log("#####  category: ", category);

  app.askToRegisterDailyUpdate(
    'what_did_i_missed',
    [{ name: "some name", textValue: "some text" }]
  );
}

// Confirm outcome of opt-in for daily updates.
function finishUpdateSetup(app) {
  console.log("====>> finish triggered")

  if (app.isUpdateRegistered()) {
    app.tell("Ok, I'll start giving you notification that time.");
  } else {
    app.tell("something went wrong when i was scheduling up notification");
  }
}



// # NOTE
// must have to enable notification 2 places, 
// - first in google action dashboard(overview>Action discovery and updates>{intent-name}>Enable User updates and notifications>set title of notification) 
// - second in google cloud console(Firebase Cloud Messaging API), 
// otherwise i will just keep saying '{your app name} is not responding'



function whatMissed(app) {

  const status = app.getArgument("boolean");
  if (status === 'yes') {
    app.tell("Ok, good job. keep it up!");
  } else {
    app.ask("would you like me to remind you again?");
  }

}

function whatMissed_yes(app) {

  app.askToRegisterDailyUpdate(
    'what_did_i_missed',
    [{ name: "some name", textValue: "some text" }]
  );
} 
