// Quick test script for the ICS import API
const fs = require('fs');

const testCalendarImport = async () => {
  try {
    const icsContent = fs.readFileSync('./test-calendar.ics', 'utf-8');
    
    console.log('Testing ICS import API...');
    console.log('ICS Content length:', icsContent.length);
    
    const response = await fetch('https://bi6vs9an4k.execute-api.us-east-1.amazonaws.com/dev/import/ics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ icsContent })
    });

    const data = await response.json();
    
    console.log('\nResponse Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ SUCCESS! Calendar import working!');
      console.log(`Found ${data.count} events`);
    } else {
      console.log('\n❌ ERROR:', data.error);
    }
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
};

testCalendarImport();

