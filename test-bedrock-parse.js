/**
 * Test script for Bedrock-powered task parsing
 * 
 * Usage: node test-bedrock-parse.js
 */

const API_BASE_URL = 'https://bi6vs9an4k.execute-api.us-east-1.amazonaws.com/dev';

const sampleSyllabus = `
CS 345 - Web Development
Fall 2025

Course Overview:
This course covers modern web development practices including frontend frameworks, 
backend APIs, and cloud deployment.

Assignments and Deadlines:

Week 1 (Oct 20-26):
- Read Chapters 1-3 of the textbook (Due Oct 26, 2 hours)
- Setup development environment (Due Oct 25, 1 hour)

Week 2 (Oct 27 - Nov 2):
- Assignment 1: Build a simple HTML/CSS page (Due Nov 2, 3 hours)
- Quiz 1: HTML & CSS fundamentals (Nov 1)

Week 3 (Nov 3-9):
- Assignment 2: JavaScript basics - Calculator app (Due Nov 9, 5 hours)
- Read Chapter 4 on JavaScript (Due Nov 8, 2 hours)

Week 4 (Nov 10-16):
- Midterm Project: Personal Portfolio Website (Due Nov 16, 10 hours)

Week 5 (Nov 17-23):
- Assignment 3: React basics (Due Nov 23, 6 hours)
- Lab: Setup Node.js backend (Nov 22, 2 hours)

Week 6-8:
- Final Project: Full-stack web application with authentication (Due Dec 15, 20 hours)
- Final Exam: Comprehensive exam on all topics (Dec 18)
`;

async function testParseTasks() {
  console.log('🧪 Testing Bedrock Task Parsing Endpoint\n');
  console.log('📝 Sample Syllabus:');
  console.log('─'.repeat(60));
  console.log(sampleSyllabus.trim());
  console.log('─'.repeat(60));
  console.log('\n🚀 Sending request to backend...\n');
  
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ syllabusText: sampleSyllabus }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log('✅ Success! Parsed tasks:\n');
    console.log(`📊 Total tasks extracted: ${result.count}`);
    console.log('─'.repeat(60));
    
    if (result.tasks && result.tasks.length > 0) {
      result.tasks.forEach((task, index) => {
        console.log(`\n${index + 1}. ${task.title}`);
        if (task.description) {
          console.log(`   Description: ${task.description}`);
        }
        console.log(`   Duration: ${task.duration || 60} minutes`);
        if (task.deadline) {
          console.log(`   Deadline: ${new Date(task.deadline).toLocaleString()}`);
        }
        console.log(`   Priority: ${task.priority || 'medium'}`);
      });
    }
    
    console.log('\n' + '─'.repeat(60));
    console.log('\n✨ Test completed successfully!');
    console.log('\n📌 Next steps:');
    console.log('   1. Check AWS DynamoDB to verify tasks were stored');
    console.log('   2. Try the UI by running: npm run dev');
    console.log('   3. Go to the Import step and paste a syllabus');
    
  } catch (error) {
    console.error('\n❌ Test failed!');
    console.error('Error:', error.message);
    
    if (error.message.includes('bedrock')) {
      console.error('\n💡 Troubleshooting:');
      console.error('   - Make sure AWS Bedrock is enabled in your AWS account');
      console.error('   - Verify Claude 3.5 Sonnet model access is granted');
      console.error('   - Check Lambda IAM permissions include bedrock:InvokeModel');
      console.error('   - Deploy backend with: amplify push');
    }
    
    process.exit(1);
  }
}

// Run the test
testParseTasks();

