/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/




const express = require('express')
const bodyParser = require('body-parser')
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')

// declare a new express app
const app = express()
app.use(bodyParser.json())
app.use(awsServerlessExpressMiddleware.eventContext())

// Enable CORS for all methods
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "*")
  next()
});


/**********************
 * Example get method *
 **********************/

app.get('/items', function(req, res) {
  // Add your code here
  res.json({success: 'get call succeed!', url: req.url});
});

app.get('/items/*', function(req, res) {
  // Add your code here
  res.json({success: 'get call succeed!', url: req.url});
});

/****************************
* Example post method *
****************************/

app.post('/items', function(req, res) {
  // Add your code here
  res.json({success: 'post call succeed!', url: req.url, body: req.body})
});

app.post('/items/*', function(req, res) {
  // Add your code here
  res.json({success: 'post call succeed!', url: req.url, body: req.body})
});

/****************************
* ICS Import Route *
****************************/

const ICAL = require('ical.js');
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.STORAGE_PLAYBLOCKSSTORAGE_NAME;

app.post('/import/ics', async function(req, res) {
  try {
    console.log('Received ICS import request');
    const icsContent = req.body.icsContent;
    
    if (!icsContent) {
      return res.status(400).json({ error: 'icsContent is required' });
    }

    // Parse the .ics file
    const jcalData = ICAL.parse(icsContent);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');

    console.log(`Found ${vevents.length} events`);

    // Convert to our format
    const items = vevents.map((vevent) => {
      const eventComp = new ICAL.Event(vevent);
      
      return {
        uid: eventComp.uid,
        type: 'event',
        title: eventComp.summary,
        start: eventComp.startDate.toJSDate().toISOString(),
        end: eventComp.endDate.toJSDate().toISOString(),
        location: eventComp.location || '',
        description: eventComp.description || ''
      };
    });

    // Store in DynamoDB
    if (TABLE_NAME && TABLE_NAME !== 'storageplayblocksstorageName') {
      console.log(`Storing ${items.length} events in DynamoDB table: ${TABLE_NAME}`);
      
      // Get user ID from request context (or use a default for testing)
      const userId = req.apiGateway?.event?.requestContext?.identity?.cognitoIdentityId || 'anonymous';
      
      const dbItems = items.map(item => ({
        PK: `USER#${userId}`,
        SK: `EVENT#${item.uid}`,
        ...item,
        createdAt: new Date().toISOString()
      }));

      // Batch write to DynamoDB (max 25 items at a time)
      const batches = [];
      for (let i = 0; i < dbItems.length; i += 25) {
        const batch = dbItems.slice(i, i + 25);
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
      console.log('Events saved to DynamoDB successfully');
    } else {
      console.log('DynamoDB table name not configured - skipping storage');
    }

    res.json({
      message: 'Events imported successfully',
      count: items.length,
      events: items
    });

  } catch (error) {
    console.error('Error importing ICS:', error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

/****************************
* Example put method *
****************************/

app.put('/items', function(req, res) {
  // Add your code here
  res.json({success: 'put call succeed!', url: req.url, body: req.body})
});

app.put('/items/*', function(req, res) {
  // Add your code here
  res.json({success: 'put call succeed!', url: req.url, body: req.body})
});

/****************************
* Example delete method *
****************************/

app.delete('/items', function(req, res) {
  // Add your code here
  res.json({success: 'delete call succeed!', url: req.url});
});

app.delete('/items/*', function(req, res) {
  // Add your code here
  res.json({success: 'delete call succeed!', url: req.url});
});

/****************************
* User Preferences Routes *
****************************/

// Get user preferences
app.get('/preferences', async function(req, res) {
  try {
    const userId = req.apiGateway?.event?.requestContext?.identity?.cognitoIdentityId || 'anonymous';
    
    if (!TABLE_NAME || TABLE_NAME === 'storageplayblocksstorageName') {
      return res.status(500).json({ error: 'DynamoDB table not configured' });
    }
    
    const result = await dynamodb.get({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: 'PROFILE#preferences'
      }
    }).promise();
    
    if (result.Item) {
      res.json({
        success: true,
        preferences: result.Item.preferences || {}
      });
    } else {
      // Return default preferences
      res.json({
        success: true,
        preferences: {
          maxBlock: 120,
          breakMinutes: 15,
          workHoursStart: '09:00',
          workHoursEnd: '17:00',
          maxHoursPerDay: 8,
          preferredDays: [1, 2, 3, 4, 5],
          mode: 'flexi'
        }
      });
    }
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save user preferences
app.post('/preferences', async function(req, res) {
  try {
    const userId = req.apiGateway?.event?.requestContext?.identity?.cognitoIdentityId || 'anonymous';
    const preferences = req.body.preferences;
    
    if (!preferences) {
      return res.status(400).json({ error: 'Preferences object is required' });
    }
    
    if (!TABLE_NAME || TABLE_NAME === 'storageplayblocksstorageName') {
      return res.status(500).json({ error: 'DynamoDB table not configured' });
    }
    
    await dynamodb.put({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${userId}`,
        SK: 'PROFILE#preferences',
        preferences: preferences,
        updatedAt: new Date().toISOString()
      }
    }).promise();
    
    res.json({
      success: true,
      message: 'Preferences saved successfully',
      preferences: preferences
    });
  } catch (error) {
    console.error('Error saving preferences:', error);
    res.status(500).json({ error: error.message });
  }
});

/****************************
* Events & Tasks Routes *
****************************/

// Get all events for a user
app.get('/events', async function(req, res) {
  try {
    const userId = req.apiGateway?.event?.requestContext?.identity?.cognitoIdentityId || 'anonymous';
    
    if (!TABLE_NAME || TABLE_NAME === 'storageplayblocksstorageName') {
      return res.status(500).json({ error: 'DynamoDB table not configured' });
    }
    
    const result = await dynamodb.query({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'EVENT#'
      }
    }).promise();
    
    res.json({
      success: true,
      events: result.Items || []
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all tasks for a user
app.get('/tasks', async function(req, res) {
  try {
    const userId = req.apiGateway?.event?.requestContext?.identity?.cognitoIdentityId || 'anonymous';
    
    if (!TABLE_NAME || TABLE_NAME === 'storageplayblocksstorageName') {
      return res.status(500).json({ error: 'DynamoDB table not configured' });
    }
    
    const result = await dynamodb.query({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'TASK#'
      }
    }).promise();
    
    res.json({
      success: true,
      tasks: result.Items || []
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

/****************************
* Plan Generation Route *
****************************/

/**
 * Build available time slots for a given date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Object} prefs - User preferences
 * @param {Array} existingEvents - Existing calendar events
 * @returns {Array} Array of available slots
 */
function buildSlots(startDate, endDate, prefs, existingEvents) {
  const slots = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    
    // Check if this day is in preferred days
    if (prefs.preferredDays && prefs.preferredDays.includes(dayOfWeek)) {
      // Parse work hours
      const [startHour, startMin] = (prefs.workHoursStart || "09:00").split(':').map(Number);
      const [endHour, endMin] = (prefs.workHoursEnd || "17:00").split(':').map(Number);
      
      const slotStart = new Date(currentDate);
      slotStart.setHours(startHour, startMin, 0, 0);
      
      const slotEnd = new Date(currentDate);
      slotEnd.setHours(endHour, endMin, 0, 0);
      
      // Check for conflicts with existing events
      let availableStart = slotStart;
      const daySlots = [];
      
      for (const event of existingEvents) {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        
        // If event conflicts with current day's work hours
        if (eventStart.toDateString() === currentDate.toDateString()) {
          // Add slot before event if there's time
          if (availableStart < eventStart) {
            const duration = (eventStart - availableStart) / (1000 * 60); // minutes
            if (duration >= 30) { // Minimum 30-min slot
              daySlots.push({
                start: new Date(availableStart),
                end: new Date(eventStart),
                duration: duration,
              });
            }
          }
          // Move available start to after the event
          if (eventEnd > availableStart) {
            availableStart = new Date(eventEnd);
          }
        }
      }
      
      // Add final slot of the day if there's time left
      if (availableStart < slotEnd) {
        const duration = (slotEnd - availableStart) / (1000 * 60);
        if (duration >= 30) {
          daySlots.push({
            start: new Date(availableStart),
            end: new Date(slotEnd),
            duration: duration,
          });
        }
      }
      
      slots.push(...daySlots);
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return slots;
}

/**
 * Check if a task fits user preferences
 * @param {Object} task - Task to check
 * @param {Object} slot - Time slot
 * @param {Object} prefs - User preferences
 * @param {Object} dailyHours - Map of date -> hours used
 * @returns {boolean} Whether the task fits
 */
function fitsPrefs(task, slot, prefs, dailyHours) {
  const mode = prefs.mode || 'flexi';
  const maxHoursPerDay = prefs.maxHoursPerDay || 8;
  const breakMinutes = prefs.breakMinutes || 15;
  
  // Check if task duration fits in slot (accounting for break)
  const taskDuration = task.duration || 60; // Default 60 min
  const requiredDuration = taskDuration + breakMinutes;
  
  if (requiredDuration > slot.duration) {
    return false;
  }
  
  // Check daily hours limit
  const dateKey = slot.start.toDateString();
  const hoursUsed = dailyHours[dateKey] || 0;
  const taskHours = taskDuration / 60;
  
  if (mode === 'strict') {
    // Strict mode: enforce hard limits
    if (hoursUsed + taskHours > maxHoursPerDay) {
      return false;
    }
  } else {
    // Flexi mode: allow up to 20% over
    if (hoursUsed + taskHours > maxHoursPerDay * 1.2) {
      return false;
    }
  }
  
  // Check task deadline if present
  if (task.deadline) {
    const deadline = new Date(task.deadline);
    if (slot.start > deadline) {
      return false;
    }
  }
  
  return true;
}

/**
 * Greedy placement algorithm
 * Places tasks in earliest available slots that fit preferences
 */
function greedyPlacement(tasks, slots, prefs) {
  const scheduledBlocks = [];
  const unscheduledTasks = [];
  const dailyHours = {}; // Track hours used per day
  
  // Sort tasks by priority (deadline, then duration)
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.deadline && b.deadline) {
      return new Date(a.deadline) - new Date(b.deadline);
    }
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return (b.duration || 60) - (a.duration || 60); // Longer tasks first
  });
  
  // Sort slots by date
  const sortedSlots = [...slots].sort((a, b) => a.start - b.start);
  
  for (const task of sortedTasks) {
    let placed = false;
    
    for (const slot of sortedSlots) {
      if (fitsPrefs(task, slot, prefs, dailyHours)) {
        const taskDuration = task.duration || 60;
        const breakMinutes = prefs.breakMinutes || 15;
        
        const blockStart = new Date(slot.start);
        const blockEnd = new Date(blockStart.getTime() + taskDuration * 60 * 1000);
        
        scheduledBlocks.push({
          id: task.id || `task-${Date.now()}-${Math.random()}`,
          title: task.title || task.name || 'Untitled Task',
          start: blockStart.toISOString(),
          end: blockEnd.toISOString(),
          duration: taskDuration,
          task: task,
        });
        
        // Update daily hours
        const dateKey = slot.start.toDateString();
        dailyHours[dateKey] = (dailyHours[dateKey] || 0) + (taskDuration / 60);
        
        // Update slot (reduce available time)
        const newSlotStart = new Date(blockEnd.getTime() + breakMinutes * 60 * 1000);
        slot.start = newSlotStart;
        slot.duration = (slot.end - newSlotStart) / (1000 * 60);
        
        placed = true;
        break;
      }
    }
    
    if (!placed) {
      unscheduledTasks.push(task);
    }
  }
  
  return { scheduledBlocks, unscheduledTasks, dailyHours };
}

app.post('/plan/generate', async function(req, res) {
  try {
    console.log('Received plan generation request');
    const { tasks, preferences, existingEvents = [], startDate, endDate } = req.body;
    
    if (!tasks || tasks.length === 0) {
      return res.status(400).json({ error: 'Tasks array is required' });
    }
    
    // Set default date range if not provided (next 7 days)
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    // Default preferences
    const prefs = {
      mode: preferences?.mode || 'flexi',
      workHoursStart: preferences?.workHoursStart || '09:00',
      workHoursEnd: preferences?.workHoursEnd || '17:00',
      maxHoursPerDay: preferences?.maxHoursPerDay || 8,
      breakMinutes: preferences?.breakMinutes || 15,
      preferredDays: preferences?.preferredDays || [1, 2, 3, 4, 5], // Mon-Fri
    };
    
    console.log(`Generating plan for ${tasks.length} tasks with ${prefs.mode} mode`);
    
    // Build available slots
    const slots = buildSlots(start, end, prefs, existingEvents);
    console.log(`Found ${slots.length} available time slots`);
    
    // Run greedy placement
    const result = greedyPlacement(tasks, slots, prefs);
    
    res.json({
      success: true,
      scheduledBlocks: result.scheduledBlocks,
      unscheduledTasks: result.unscheduledTasks,
      dailyHours: result.dailyHours,
      preferences: prefs,
      stats: {
        totalTasks: tasks.length,
        scheduled: result.scheduledBlocks.length,
        unscheduled: result.unscheduledTasks.length,
        availableSlots: slots.length,
      },
    });
    
  } catch (error) {
    console.error('Error generating plan:', error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

/****************************
* Bedrock Task Parsing Route *
****************************/

const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

// Configure Bedrock client with explicit credentials
const bedrockClient = new BedrockRuntimeClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID_BEDROCK || process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_BEDROCK || process.env.AWS_SECRET_ACCESS_KEY
  }
});

/**
 * Parse tasks from syllabus text using AWS Bedrock (Claude)
 */
app.post('/tasks/parse', async function(req, res) {
  try {
    console.log('Received task parsing request');
    const { syllabusText } = req.body;
    
    if (!syllabusText || syllabusText.trim().length === 0) {
      return res.status(400).json({ error: 'syllabusText is required' });
    }
    
    // Create prompt for Bedrock
    const prompt = `You are a task extraction assistant. Given a course syllabus or project description, extract all actionable tasks with their details.

Extract tasks in this JSON format:
{
  "tasks": [
    {
      "title": "Task name",
      "description": "Brief description",
      "duration": 60,
      "deadline": "2025-12-31T23:59:59Z",
      "priority": "high"
    }
  ]
}

Rules:
- duration is in minutes (estimate based on task complexity)
- deadline should be in ISO 8601 format if mentioned, otherwise null
- priority can be "high", "medium", or "low"
- Extract assignments, projects, readings, exams, labs, etc.
- Be specific but concise in titles

Syllabus:
${syllabusText}

Return only valid JSON, no other text.`;

    console.log('Calling Bedrock with prompt length:', prompt.length);
    
    // Call Bedrock Claude model
    // Use inference profile for cross-region routing and on-demand access
    const modelId = 'us.anthropic.claude-3-5-sonnet-20241022-v2:0'; // Claude 3.5 Sonnet with US inference profile
    
    const input = {
      modelId: modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 4096,
        temperature: 0.3,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    };
    
    const command = new InvokeModelCommand(input);
    const response = await bedrockClient.send(command);
    
    // Parse response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    console.log('Bedrock response:', JSON.stringify(responseBody, null, 2));
    
    let parsedTasks = [];
    
    // Extract the text content from Claude's response
    if (responseBody.content && responseBody.content.length > 0) {
      const textContent = responseBody.content[0].text;
      
      // Try to extract JSON from the response
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const tasksData = JSON.parse(jsonMatch[0]);
        parsedTasks = tasksData.tasks || [];
      }
    }
    
    console.log(`Extracted ${parsedTasks.length} tasks from syllabus`);
    
    // Get user ID and store tasks in DynamoDB
    if (TABLE_NAME && TABLE_NAME !== 'storageplayblocksstorageName' && parsedTasks.length > 0) {
      const userId = req.apiGateway?.event?.requestContext?.identity?.cognitoIdentityId || 'anonymous';
      
      const dbItems = parsedTasks.map((task, index) => ({
        PK: `USER#${userId}`,
        SK: `TASK#${Date.now()}-${index}`,
        id: `task-${Date.now()}-${index}`,
        type: 'task',
        title: task.title,
        description: task.description || '',
        duration: task.duration || 60,
        deadline: task.deadline || null,
        priority: task.priority || 'medium',
        createdAt: new Date().toISOString()
      }));
      
      // Batch write to DynamoDB
      const batches = [];
      for (let i = 0; i < dbItems.length; i += 25) {
        const batch = dbItems.slice(i, i + 25);
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
      console.log('Tasks saved to DynamoDB successfully');
    }
    
    res.json({
      success: true,
      message: 'Tasks parsed successfully',
      count: parsedTasks.length,
      tasks: parsedTasks.map((task, index) => ({
        id: `task-${Date.now()}-${index}`,
        ...task
      }))
    });
    
  } catch (error) {
    console.error('Error parsing tasks:', error);
    res.status(500).json({
      error: error.message,
      stack: error.stack,
      hint: 'Make sure Bedrock is enabled in your AWS account and the Lambda has proper IAM permissions'
    });
  }
});

app.listen(3000, function() {
    console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
