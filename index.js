// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';

const functions = require('firebase-functions');
const { WebhookClient } = require('dialogflow-fulfillment');
const { Card, Suggestion } = require('dialogflow-fulfillment');
const { LinkOutSuggestion } = require('actions-on-google');
const { Permission } = require('actions-on-google');
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

var dateTemp;

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
    const agent = new WebhookClient({ request, response });
    agent.requestSource = agent.ACTIONS_ON_GOOGLE;
    console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
    console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

    function welcome(agent) {
        agent.add(`Welcome to your travel assitant!`);
    }

    function fallback(agent) {
        agent.add(`Sorry, I didn't get that. Can you rephrase?`);
    }

    function incorrectSeatNumberHandler(agent) {
        let session_vars = agent.getContext('session_vars');
        var geo_city = session_vars.parameters['geo-city'];
        var geo_city1 = session_vars.parameters['geo-city1'];
        var travel_class = session_vars.parameters.travel_class;
        var res = `Awesome, please select your seat for train from ${geo_city} to ${geo_city1} for ${travel_class} ?`;
        var seat = 'A | 1 2 3 4 5 6' + '\n' + 'B | 1 2 3 4 5 6' + '\n' + 'C | 1 2 3 4 5 6';
        agent.add(res);
        agent.add(seat);
    }

    function slotFillingTrainHandler(agent) {
        var geo_city = agent.parameters['geo-city'];
        var geo_city1 = agent.parameters['geo-city1'];

        if (!geo_city) {
            agent.add(`What's the origin of train?`);
            agent.add(new Suggestion(`Detect Location`));
            agent.add(new Suggestion(`Delhi`));
            agent.add(new Suggestion(`Mumbai`));
            agent.add(new Suggestion(`Banglore`));
        }
        else if (!geo_city1) {
            agent.add('Some dummy text');
            agent.setFollowupEvent({
                'name': 'train_destination_event',
                'parameters': {
                    'geo-city': geo_city,

                }
            });
        }
        else {
            agent.setContext({
                'name': 'train_context',
                'lifespan': 1,
                'parameters': {
                    'geo-city': geo_city,
                    'geo-city1': geo_city1
                }
            });
            agent.add('Some dummy text');
            agent.setFollowupEvent('train_date_event');
        }
    }

    function carBookHandler(agent) {
        let session_vars = agent.getContext('session_vars');
        var geo_city = session_vars.parameters['geo-city1'];
        var date = session_vars.parameters.date;
        var date_original = session_vars.parameters['date.original'];

        agent.setContext({
            'name': 'bookcars_date_context',
            'lifespan': 1,
            'parameters': {
                'date': date
            }
        });
        agent.add('Some dummy text');
        agent.setFollowupEvent('car_name_event');

    }
	
    function startAgainHandler(agent) {
        agent.add('Some dummy text');
        agent.setContext({ 'name': 'session_vars', 'lifespan': 0 });
        agent.setFollowupEvent('Welcome');
    }

    function dateChangeHandler(agent) {
        let session_vars = agent.getContext('session_vars');
        var geo_city = session_vars.parameters['geo-city'];
        var geo_city1 = session_vars.parameters['geo-city1'];

        agent.setContext({
            'name': 'train_context',
            'lifespan': 1,
            'parameters': {
                'geo-city': geo_city,
                'geo-city1': geo_city1
            }
        });
        agent.add('Some dummy text');
        agent.setFollowupEvent('train_date_event');

    }

    function destinationChangeHandler(agent) {
        let session_vars = agent.getContext('session_vars');
        var geo_city = session_vars.parameters['geo-city'];
        agent.add('Some dummy text');
        agent.setFollowupEvent({
            'name': 'train_destination_event',
            'parameters': {
                'geo-city': geo_city,

            }
        });
    }

    function redirectToPaymentHandler(agent) {
        agent.add('Some dummy text');
        agent.setFollowupEvent('payment_confirmation_link_event');
    }

    function getSeatHandler(agent) {
        agent.add('Some dummy text');
        agent.setFollowupEvent('train_seat_event');
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function paymentHandler(agent) {
        agent.add('Some dummy text');
        agent.setFollowupEvent('payment_confimration_link_event');

    }

    function requestPermissionHandler(agent) {
        let conv = agent.conv();
        conv.ask(new Permission({
            context: 'To give results in your area',
            permissions: 'DEVICE_PRECISE_LOCATION',
        }));
        agent.add(conv);
    }

    function userLocationHandler(agent) {
        let conv = agent.conv();
        var city = conv.device.location.city;
        agent.add('Some dummy text');
        agent.setFollowupEvent({
            'name': 'train_destination_event',
            'parameters': {
                'geo-city': city,

            }
        });
    }

    function paymentConfirmationHandler(agent) {
      var randomId = (Math.random()+1).toString(36).substr(2);
      var msg = 'Thank you for your payment! Your tickets have been booked and your booking id is ' + randomId;
      agent.add(msg);
      agent.add('Do you want to book car also ?');
    }

    function noBookingHandler(agent) {
        dateTemp = Math.floor(Date.now() / 1000);
        agent.add('Thank you for contacting us.');
      	agent.add('Have a nice day.');
    }

    function carBookFollowUpHandler(agent) {
        var date1 = Math.floor(Date.now() / 1000);
        if (date1 - dateTemp <= 20) {
            let session_vars = agent.getContext('session_vars');
            var geo_city1 = session_vars.parameters['geo-city1'];
            agent.add(`Do you want to book car for ${geo_city1} ?`);
        }
        else {
            agent.setContext({ 'name': 'session_vars', 'lifespan': 0 });
            agent.add('Some dummy text');
            agent.setFollowupEvent('book_cars_location_event');
        }

    }

    function carBookFollowUpNoHandler(agent) {
        agent.setContext({ 'name': 'session_vars', 'lifespan': 0 });
        agent.add('Some dummy text');
        agent.setFollowupEvent('book_cars_location_event');
    }

    // // See https://github.com/dialogflow/fulfillment-actions-library-nodejs
    // // for a complete Dialogflow fulfillment library Actions on Google client library v2 integration sample

    // Run the proper function handler based on the matched Dialogflow intent name
    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    intentMap.set('book_trains', slotFillingTrainHandler);
    intentMap.set('book_trains_incorrect_seatno', incorrectSeatNumberHandler);
    intentMap.set('book_trains_followup_get_seat- no', redirectToPaymentHandler);
    intentMap.set('book_trains_startover', startAgainHandler);
    intentMap.set('book_trains_payment_conf_car_book-yes', carBookHandler);
    intentMap.set('book_trains_change_destination', destinationChangeHandler);
    intentMap.set('book_trains_change_date', dateChangeHandler);
    intentMap.set('book_trains_followup_get_seat - yes', getSeatHandler);
    intentMap.set('request_permission', requestPermissionHandler);
    intentMap.set('user_info', userLocationHandler);
    intentMap.set('book_trains_payment_confirmation', paymentConfirmationHandler);
    intentMap.set('book_trains_payment_conf_car_book-no', noBookingHandler);
    intentMap.set('book_trains_followup_car_book', carBookFollowUpHandler);
    intentMap.set('book_trains_followup_car_book - yes', carBookHandler);
    intentMap.set('book_trains_followup_car_book - no', carBookFollowUpNoHandler);
    agent.handleRequest(intentMap);
});