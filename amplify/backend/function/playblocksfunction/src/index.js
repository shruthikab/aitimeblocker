const ICAL = require('ical.js');
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.STORAGE_DYNAMODB_TABLE_NAME; // Amplify sets this

exports.handler = async (event) => {
  try {
    // Get the .ics file content from the request
    const body = JSON.parse(event.body);
    const icsContent = body.icsContent; // Base64 or raw text
    const userId = event.requestContext.identity.cognitoIdentityId;

    // Parse the .ics file
    const jcalData = ICAL.parse(icsContent);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');

    // Convert to our format and prepare for DynamoDB
    const items = vevents.map((vevent) => {
      const eventComp = new ICAL.Event(vevent);
      
      return {
        PK: `USER#${userId}`,
        SK: `EVENT#${eventComp.uid}`,
        type: 'event',
        title: eventComp.summary,
        start: eventComp.startDate.toJSDate().toISOString(),
        end: eventComp.endDate.toJSDate().toISOString(),
        location: eventComp.location || '',
        description: eventComp.description || ''
      };
    });

    // Batch write to DynamoDB (max 25 items at a time)
    const batches = [];
    for (let i = 0; i < items.length; i += 25) {
      const batch = items.slice(i, i + 25);
      batches.push(
        dynamodb.batchWrite({
          RequestItems: {
            [TABLE_NAME]: batch.map(item => ({
              PutRequest: { Item: item }
            }))
          }
        }).promise()
      );
    }

    await Promise.all(batches);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        message: 'Events imported successfully',
        count: items.length
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message })
    };
  }
};