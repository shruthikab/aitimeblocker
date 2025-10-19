/**
 * Unit test for /plan/generate endpoint
 * Run with: node test-plan-generate.js
 */

// Mock data for testing
const fakeTasks = [
  {
    id: 'task-1',
    title: 'Write project proposal',
    duration: 120, // 2 hours
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
  },
  {
    id: 'task-2',
    title: 'Code review session',
    duration: 90, // 1.5 hours
  },
  {
    id: 'task-3',
    title: 'Team meeting prep',
    duration: 60, // 1 hour
    deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
  },
  {
    id: 'task-4',
    title: 'Update documentation',
    duration: 45,
  },
  {
    id: 'task-5',
    title: 'Client presentation',
    duration: 180, // 3 hours
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const fakeExistingEvents = [
  {
    title: 'Standup Meeting',
    start: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    end: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(), // 30 min
  },
  {
    title: 'Lunch Break',
    start: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // 1 hour
  },
];

const strictPreferences = {
  mode: 'strict',
  workHoursStart: '09:00',
  workHoursEnd: '17:00',
  maxHoursPerDay: 6,
  breakMinutes: 15,
  preferredDays: [1, 2, 3, 4, 5], // Mon-Fri
};

const flexiPreferences = {
  mode: 'flexi',
  workHoursStart: '08:00',
  workHoursEnd: '18:00',
  maxHoursPerDay: 8,
  breakMinutes: 10,
  preferredDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
};

function testPlanGeneration() {
  console.log('='.repeat(60));
  console.log('UNIT TEST: Plan Generation Algorithm');
  console.log('='.repeat(60));

  // Test 1: Strict Mode
  console.log('\n📋 Test 1: Strict Mode');
  console.log('-'.repeat(60));
  const strictPayload = {
    tasks: fakeTasks,
    preferences: strictPreferences,
    existingEvents: fakeExistingEvents,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
  console.log('Input:', JSON.stringify(strictPayload, null, 2));
  console.log('\nExpected: Tasks scheduled respecting 6h/day strict limit');

  // Test 2: Flexi Mode
  console.log('\n📋 Test 2: Flexi Mode');
  console.log('-'.repeat(60));
  const flexiPayload = {
    tasks: fakeTasks,
    preferences: flexiPreferences,
    existingEvents: fakeExistingEvents,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
  console.log('Input:', JSON.stringify(flexiPayload, null, 2));
  console.log('\nExpected: More tasks scheduled with flexible 8h+20% limit');

  // Test 3: With Deadlines
  console.log('\n📋 Test 3: Deadline Priority');
  console.log('-'.repeat(60));
  const urgentTasks = [
    {
      id: 'urgent-1',
      title: 'Urgent bug fix',
      duration: 120,
      deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'normal-1',
      title: 'Regular task',
      duration: 60,
    },
  ];
  console.log('Tasks:', JSON.stringify(urgentTasks, null, 2));
  console.log('\nExpected: Urgent tasks scheduled before regular tasks');

  // Test 4: Burnout Guard
  console.log('\n📋 Test 4: Burnout Guard Test');
  console.log('-'.repeat(60));
  const manyTasks = Array.from({ length: 10 }, (_, i) => ({
    id: `task-${i}`,
    title: `Task ${i + 1}`,
    duration: 120, // 2 hours each = 20 hours total
  }));
  console.log(`Scheduling ${manyTasks.length} tasks (2h each = 20h total)`);
  console.log('Max hours per day: 6h (strict mode)');
  console.log('\nExpected: Tasks spread across multiple days, max 6h/day');

  console.log('\n' + '='.repeat(60));
  console.log('✅ Test definitions complete');
  console.log('To run these tests, send POST requests to /plan/generate');
  console.log('Or integrate with your test framework');
  console.log('='.repeat(60));
}

// Example API call format
function exampleAPICall() {
  console.log('\n📡 Example API Call:');
  console.log('-'.repeat(60));
  console.log(`
POST https://YOUR-API-URL/dev/plan/generate
Content-Type: application/json

{
  "tasks": ${JSON.stringify(fakeTasks.slice(0, 2), null, 2)},
  "preferences": ${JSON.stringify(strictPreferences, null, 2)},
  "existingEvents": ${JSON.stringify(fakeExistingEvents, null, 2)},
  "startDate": "${new Date().toISOString()}",
  "endDate": "${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()}"
}
  `);
}

// Run tests
if (require.main === module) {
  testPlanGeneration();
  exampleAPICall();
}

module.exports = {
  fakeTasks,
  fakeExistingEvents,
  strictPreferences,
  flexiPreferences,
  testPlanGeneration,
};

