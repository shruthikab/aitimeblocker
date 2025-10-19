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
  // If enforceWorkingHours is false, treat the window as full day
  const enforce = typeof prefs.enforceWorkingHours === 'undefined' ? true : !!prefs.enforceWorkingHours;
  const [startHour, startMin] = (enforce ? (prefs.workHoursStart || "09:00") : "00:00").split(':').map(Number);
  const [endHour, endMin] = (enforce ? (prefs.workHoursEnd || "17:00") : "23:59").split(':').map(Number);

      const daySlots = [];

      // Helper to build free sub-slots for a given interval [sDate, eDate)
      const buildSubSlots = (sDate, eDate) => {
        let availableStart = new Date(sDate);
        for (const event of existingEvents) {
          const eventStart = new Date(event.start);
          const eventEnd = new Date(event.end);

          // Only consider events on the same day as availableStart
          if (eventStart.toDateString() === availableStart.toDateString()) {
            if (availableStart < eventStart) {
              const duration = (eventStart - availableStart) / (1000 * 60); // minutes
              if (duration >= 30) {
                daySlots.push({ start: new Date(availableStart), end: new Date(eventStart), duration });
              }
            }
            if (eventEnd > availableStart) {
              availableStart = new Date(eventEnd);
            }
          }
        }

        if (availableStart < eDate) {
          const duration = (eDate - availableStart) / (1000 * 60);
          if (duration >= 30) {
            daySlots.push({ start: new Date(availableStart), end: new Date(eDate), duration });
          }
        }
      };

      // If work window does not wrap midnight
      const startTotal = startHour * 60 + startMin;
      const endTotal = endHour * 60 + endMin;

      if (startTotal <= endTotal) {
        const slotStart = new Date(currentDate);
        slotStart.setHours(startHour, startMin, 0, 0);
        const slotEnd = new Date(currentDate);
        slotEnd.setHours(endHour, endMin, 0, 0);
        buildSubSlots(slotStart, slotEnd);
      } else {
        // Overnight window: create two sub-windows for this day
        // Evening window: start -> 24:00 of currentDate
        const slotStartEvening = new Date(currentDate);
        slotStartEvening.setHours(startHour, startMin, 0, 0);
        const slotEndEvening = new Date(currentDate);
        slotEndEvening.setHours(24, 0, 0, 0); // midnight next day
        buildSubSlots(slotStartEvening, slotEndEvening);

        // Morning window: 00:00 -> end on this day
        const slotStartMorning = new Date(currentDate);
        slotStartMorning.setHours(0, 0, 0, 0);
        const slotEndMorning = new Date(currentDate);
        slotEndMorning.setHours(endHour, endMin, 0, 0);
        buildSubSlots(slotStartMorning, slotEndMorning);
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
 * Generate break suggestions using AWS Bedrock
 */
async function generateBreakSuggestions(beforeTask, afterTask, breakDuration) {
  try {
    const prompt = `You are a wellness and productivity assistant. Generate 2-3 brief, specific suggestions for a ${breakDuration}-minute break between tasks.

Context:
- Previous activity: ${beforeTask || 'Start of day'}
- Next activity: ${afterTask || 'End of day'}

Provide suggestions that:
1. Help with mental recovery and context switching
2. Are realistic for the time available
3. Consider the transition between activities
4. Promote physical and mental wellbeing

Return as a JSON array of strings, each suggestion 5-10 words max.
Example: ["Take a short walk outside", "Stretch and hydrate", "Quick breathing exercises"]

Return ONLY the JSON array, no other text.`;

    const modelId = 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';
    const input = {
      modelId: modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 200,
        temperature: 0.7,
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
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    if (responseBody.content && responseBody.content.length > 0) {
      const textContent = responseBody.content[0].text;
      const jsonMatch = textContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0]);
        return suggestions;
      }
    }
    
    // Fallback suggestions
    return ['Take a short break', 'Stretch and hydrate', 'Rest your eyes'];
  } catch (error) {
    console.error('Failed to generate break suggestions:', error);
    // Return generic suggestions as fallback
    return ['Take a short break', 'Walk around', 'Stay hydrated'];
  }
}

/**
 * Greedy placement algorithm
 * Places tasks in earliest available slots that fit preferences
 * Now creates explicit break blocks with AI-generated suggestions
 */
async function greedyPlacement(tasks, slots, prefs) {
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
  
  const MAX_CHUNK_MIN = 90; // cap blocks at 90 minutes

  for (const task of sortedTasks) {
    let remaining = task.duration || 60; // minutes remaining to schedule
    const breakMinutes = prefs.breakMinutes || 15;

    // Try to fill the task across multiple slots until remaining <= 0
    for (const slot of sortedSlots) {
      if (remaining <= 0) break;

      // Skip slots that are too small to be useful
      const usable = Math.max(0, Math.floor(slot.duration - breakMinutes));
      if (usable < 15) continue;

      // Determine chunk length (capped at MAX_CHUNK_MIN and usable)
      const chunk = Math.min(remaining, usable, MAX_CHUNK_MIN);

      // Check daily hours constraints for this chunk
      const dateKey = slot.start.toDateString();
      const hoursUsed = dailyHours[dateKey] || 0;
      const chunkHours = chunk / 60;
      const maxHoursPerDay = prefs.maxHoursPerDay || 8;
      const mode = prefs.mode || 'flexi';
      const allowedLimit = mode === 'strict' ? maxHoursPerDay : maxHoursPerDay * 1.2;
      if (hoursUsed + chunkHours > allowedLimit) {
        // Can't place this chunk on this day
        continue;
      }

      // Check deadline: ensure slot.start is not after task.deadline
      if (task.deadline) {
        const deadline = new Date(task.deadline);
        if (slot.start > deadline) {
          continue;
        }
      }

      // Place the task chunk
      const blockStart = new Date(slot.start);
      const blockEnd = new Date(blockStart.getTime() + chunk * 60 * 1000);

      scheduledBlocks.push({
        id: `${task.id || `task-${Date.now()}-${Math.random()}`}-${scheduledBlocks.length}`,
        title: task.title || task.name || 'Untitled Task',
        start: blockStart.toISOString(),
        end: blockEnd.toISOString(),
        duration: chunk,
        type: 'task',
        task: task,
      });

      // Create break block after this task chunk (if there's space)
      if (breakMinutes >= 5 && slot.duration >= chunk + breakMinutes) {
        const breakStart = new Date(blockEnd);
        const breakEnd = new Date(breakStart.getTime() + breakMinutes * 60 * 1000);
        
        // Generate AI suggestions for this break (do this after all blocks are created)
        scheduledBlocks.push({
          id: `break-${scheduledBlocks.length}-${Date.now()}`,
          title: `Break (${breakMinutes} min)`,
          start: breakStart.toISOString(),
          end: breakEnd.toISOString(),
          duration: breakMinutes,
          type: 'break',
          suggestions: [], // Will be populated with AI suggestions later
          beforeTask: task.title || task.name,
          afterTask: null, // Will be updated if there's a next task
        });
      }

      // Update daily hours
      dailyHours[dateKey] = (dailyHours[dateKey] || 0) + chunkHours;

      // Reduce remaining time and advance slot
      remaining -= chunk;
      const newSlotStart = new Date(blockEnd.getTime() + breakMinutes * 60 * 1000);
      slot.start = newSlotStart;
      slot.duration = (slot.end - newSlotStart) / (1000 * 60);
    }

    if (remaining > 0) {
      // Could not fully schedule the task
      unscheduledTasks.push({ ...task, remaining });
    }
  }
  
  // Now generate AI suggestions for breaks
  // Update afterTask context for each break
  for (let i = 0; i < scheduledBlocks.length; i++) {
    const block = scheduledBlocks[i];
    if (block.type === 'break') {
      // Find the next task block
      const nextTask = scheduledBlocks.slice(i + 1).find(b => b.type === 'task');
      if (nextTask) {
        block.afterTask = nextTask.title;
      }
    }
  }
  
  // Generate suggestions for a sample of breaks (to avoid too many API calls)
  const breakBlocks = scheduledBlocks.filter(b => b.type === 'break');
  const breakSuggestionPromises = breakBlocks.slice(0, 10).map(async (breakBlock) => {
    try {
      const suggestions = await generateBreakSuggestions(
        breakBlock.beforeTask,
        breakBlock.afterTask,
        breakBlock.duration
      );
      breakBlock.suggestions = suggestions;
    } catch (error) {
      console.error('Failed to generate suggestions for break:', error);
      breakBlock.suggestions = ['Take a short break', 'Stretch and relax'];
    }
  });
  
  await Promise.all(breakSuggestionPromises);
  
  // For remaining breaks without suggestions, use generic ones
  scheduledBlocks.forEach(block => {
    if (block.type === 'break' && (!block.suggestions || block.suggestions.length === 0)) {
      block.suggestions = ['Take a short break', 'Stretch and hydrate', 'Rest your mind'];
    }
  });
  
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
    // Debug: log incoming preferences and tasks summary
    try {
      console.log('Preferences:', JSON.stringify(prefs));
      console.log('Tasks summary:', tasks.map(t => ({ title: t.title, duration: t.duration, deadline: t.deadline })).slice(0, 20));
    } catch (e) {
      console.log('Failed to stringify prefs/tasks for debug', e);
    }
    
    // Build available slots
    const slots = buildSlots(start, end, prefs, existingEvents);
    console.log(`Found ${slots.length} available time slots`);
    // Debug: show first few slots to inspect times (ISO)
    try {
      const sample = slots.slice(0, 12).map(s => ({ start: s.start.toISOString(), end: s.end.toISOString(), duration: s.duration }));
      console.log('Sample slots:', JSON.stringify(sample, null, 2));
    } catch (e) {
      console.log('Failed to stringify sample slots', e);
    }
    
    // Run greedy placement (now async due to AI break suggestions)
    const result = await greedyPlacement(tasks, slots, prefs);
    
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
