export async function saveEvents(events) {
  // TODO: Replace with DynamoDB batchWrite or Amplify DataStore.
  // For now just return the input as a fake "saved" array with ids.
  return events.map((e, i) => ({ id: `fake-${i + 1}`, ...e }));
}
