/* const express = require('express');
const webhookRouter = express.Router(); */
/* const { useSelector } = require('react-redux');
const { selectItems } = require('../reduxslices/basketslice'); */

const { createOrder } = require('../../backend/dbadapters/orders');

const { getUserById } = require('../../backend/dbadapters/users');

const webhookRouter = require('express')();

const stripe = require('stripe')('sk_test_51KepPXD7lX2ovvhcicz2AvcKBiAuLYyJga2nf6rSF0QiwHTgiQ81zuwVvynSFfxxNjsxvQ7WVx6cztwHeCOIINRP00kJUGG5gh');
    
const bodyParser = require('body-parser');

/* Webhook Secret: */
const webhookEndpointSecret = 'whsec_613cad032f31e2eb00c8668fe4cfe5691d8ef7e805dad8ea1e585cfb9eea5862';


/* TODO: Fulfilling an order & pushing Stripe data into my DB if checkout session completed: */

/* WILL HAVE TO GET LINE ITEMS FOR THIS TO WORK 

- from session can get: quantity of each item
- from my frontend can get: quantity each item, product_id -> selectTotal from basketSlice works for amount_total.

- 8/15/22 -> WORKS, but need to resolve syntax conflicts with ES6 modules so I can use my redux code for the fulfullOrder arguments

*/
   /*  const items = useSelector( selectItems );
    console.log(items) */

    const fulfillOrder = async ( session ) => {
        
       /*  try {
            await getUserById
        } */

        return createOrder( {
            user_id: 1,
            /* TODO: useSelectTotal for cart Total */
            /* amount_total: session.amount_total, */
            amount_total: 165.94,
            currency: session.currency,
            status: session.status,
            created_at: require('moment')().format('YYYY-MM-DD HH:mm:ss'),
            /* TODO: Need to use redux selectItems here */
            order_items: [
                {
                    orders_id: null,
                    product_id: 2,
                    quantity: 2,
                },
            ]

        })
    
        /* return createOrder( {
            userId: 1,
            orderDate: '2022-07-28 18:10:25-07',
            shippingStreet: session.customer_details.address.line1,
            shippingZip: session.customer_details.address.postal_code,
            shippingCity: session.customer_details.address.city,
            shippingCountry: session.customer_details.address.country,
            shippingState: session.customer_details.address.state,
            currency: session.currency,
            amountTotal: session.amount_total,
        }) */
        
        
    };

/* Webhook TODO: */
/* extract some events from stripe: */
/* This would be for my deployed app: */
    webhookRouter.post('/webhook', bodyParser.raw({type: 'application/json'}), async (req, res) => {
        console.log('Firing from webhook!!!!')
        const signature = req.headers['stripe-signature'];
        let event;

    //Verify event came from Stripe:
        try {
            event = await stripe.webhooks.constructEvent(
                req.body, 
                signature, 
                webhookEndpointSecret
            );

        } catch(err) {
           res.status(400).send(`Webhook Error: ${err.message}`);
           console.log('My error from webhook: ', err)
           return;
        }

    //Handle the Stripe events:
        switch(event.type) {
              
            case 'checkout.session.completed':
                const session = event.data.object;
                console.log("Checkout Session ID: ", session.id)
                console.log("Checkout Session object: ", session)
                
    //Fulfill an order:

                return fulfillOrder(session)
                    .then( () => res.status(200).end() )
                    .catch( (err) => res.status(400).send(`Error in Webhook: ${err.message}`));
                
            case 'payment_intent.created':
                const paymentIntent = event.data.object;
                console.log("PatmentIntent Created: ", paymentIntent.id);
                break;
            case 'payment_intent.succeeded':
                const paymentIntentSuccess = event.data.object;
                console.log('Webhook: Payment Intent was successful!', paymentIntentSuccess)
                break;
            default:
                console.log('Unkown event type: ' + event.type)
        }

        res.send({ message: 'success from webhook!'})
    });


    webhookRouter.listen(4242, () => console.log('Webhook Running on port 4242'));

module.exports = webhookRouter;