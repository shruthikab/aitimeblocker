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

const app = express()
app.use(bodyParser.json())
app.use(awsServerlessExpressMiddleware.eventContext())

// Enable CORS for all methods
app.use(function(_req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "*")
  next()
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
    const icsContent = req.body.icsContent;

    if (!icsContent) {
      return res.status(400).json({ error: 'icsContent is required' });
    }

    const jcalData = ICAL.parse(icsContent);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');

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

    if (TABLE_NAME && TABLE_NAME !== 'storageplayblocksstorageName') {
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
    }

    res.json({
      message: 'Events imported successfully',
      count: items.length,
      events: items
    });

  } catch (error) {
    console.error('Error importing ICS:', error);
    res.status(500).json({ error: error.message });
  }
});

/****************************
* User Preferences Routes *
****************************/

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
      res.json({ success: true, preferences: result.Item.preferences || {} });
    } else {
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

    res.json({ success: true, message: 'Preferences saved successfully', preferences });
  } catch (error) {
    console.error('Error saving preferences:', error);
    res.status(500).json({ error: error.message });
  }
});

/****************************
* Events & Tasks Routes *
****************************/

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

    res.json({ success: true, events: result.Items || [] });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: error.message });
  }
});

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

    res.json({ success: true, tasks: result.Items || [] });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

/****************************
* Plan Generation Route *
****************************/

function buildSlots(startDate, endDate, prefs, existingEvents) {
  const slots = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();

    if (prefs.preferredDays && prefs.preferredDays.includes(dayOfWeek)) {
      const [startHour, startMin] = (prefs.workHoursStart || "09:00").split(':').map(Number);
      const [endHour, endMin] = (prefs.workHoursEnd || "17:00").split(':').map(Number);

      const slotStart = new Date(currentDate);
      slotStart.setHours(startHour, startMin, 0, 0);

      const slotEnd = new Date(currentDate);
      slotEnd.setHours(endHour, endMin, 0, 0);

      let availableStart = slotStart;
      const daySlots = [];

      for (const event of existingEvents) {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);

        if (eventStart.toDateString() === currentDate.toDateString()) {
          if (availableStart < eventStart) {
            const duration = (eventStart - availableStart) / (1000 * 60);
            if (duration >= 30) {
              daySlots.push({
                start: new Date(availableStart),
                end: new Date(eventStart),
                duration,
              });
            }
          }
          if (eventEnd > availableStart) {
            availableStart = new Date(eventEnd);
          }
        }
      }

      if (availableStart < slotEnd) {
        const duration = (slotEnd - availableStart) / (1000 * 60);
        if (duration >= 30) {
          daySlots.push({
            start: new Date(availableStart),
            end: new Date(slotEnd),
            duration,
          });
        }
      }

      slots.push(...daySlots);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return slots;
}

function fitsPrefs(task, slot, prefs, dailyHours) {
  const mode = prefs.mode || 'flexi';
  const maxHoursPerDay = prefs.maxHoursPerDay || 8;
  const breakMinutes = prefs.breakMinutes || 15;
  const taskDuration = task.duration || 60;
  const requiredDuration = taskDuration + breakMinutes;

  if (requiredDuration > slot.duration) return false;

  const dateKey = slot.start.toDateString();
  const hoursUsed = dailyHours[dateKey] || 0;
  const taskHours = taskDuration / 60;
  const limit = mode === 'strict' ? maxHoursPerDay : maxHoursPerDay * 1.2;

  if (hoursUsed + taskHours > limit) return false;

  if (task.deadline && slot.start > new Date(task.deadline)) return false;

  return true;
}

function greedyPlacement(tasks, slots, prefs) {
  const scheduledBlocks = [];
  const unscheduledTasks = [];
  const dailyHours = {};

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.deadline && b.deadline) return new Date(a.deadline) - new Date(b.deadline);
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return (b.duration || 60) - (a.duration || 60);
  });

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
          task,
        });

        const dateKey = slot.start.toDateString();
        dailyHours[dateKey] = (dailyHours[dateKey] || 0) + (taskDuration / 60);

        const newSlotStart = new Date(blockEnd.getTime() + breakMinutes * 60 * 1000);
        slot.start = newSlotStart;
        slot.duration = (slot.end - newSlotStart) / (1000 * 60);

        placed = true;
        break;
      }
    }

    if (!placed) unscheduledTasks.push(task);
  }

  return { scheduledBlocks, unscheduledTasks, dailyHours };
}

app.post('/plan/generate', async function(req, res) {
  try {
    const { tasks, preferences, existingEvents = [], startDate, endDate } = req.body;

    if (!tasks || tasks.length === 0) {
      return res.status(400).json({ error: 'Tasks array is required' });
    }

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const prefs = {
      mode: preferences?.mode || 'flexi',
      workHoursStart: preferences?.workHoursStart || '09:00',
      workHoursEnd: preferences?.workHoursEnd || '17:00',
      maxHoursPerDay: preferences?.maxHoursPerDay || 8,
      breakMinutes: preferences?.breakMinutes || 15,
      preferredDays: preferences?.preferredDays || [1, 2, 3, 4, 5],
    };

    const slots = buildSlots(start, end, prefs, existingEvents);
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
    res.status(500).json({ error: error.message });
  }
});

/****************************
* Bedrock Task Parsing Route *
****************************/

const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const bedrockClient = new BedrockRuntimeClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID_BEDROCK || process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_BEDROCK || process.env.AWS_SECRET_ACCESS_KEY
  }
});

app.post('/tasks/parse', async function(req, res) {
  try {
    const { syllabusText } = req.body;

    if (!syllabusText || syllabusText.trim().length === 0) {
      return res.status(400).json({ error: 'syllabusText is required' });
    }

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

    const modelId = 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';

    const command = new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 4096,
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    let parsedTasks = [];

    if (responseBody.content && responseBody.content.length > 0) {
      const textContent = responseBody.content[0].text;
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const tasksData = JSON.parse(jsonMatch[0]);
        parsedTasks = tasksData.tasks || [];
      }
    }

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
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, function() {
  console.log("App started")
});

module.exports = app
