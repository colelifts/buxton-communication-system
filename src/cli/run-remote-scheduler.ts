const schedulerUrl = process.env.SCHEDULER_URL;
const schedulerSecret = process.env.SCHEDULER_SECRET;

if (!schedulerUrl || !schedulerSecret) {
  console.error("SCHEDULER_URL and SCHEDULER_SECRET are required.");
  process.exit(1);
}

const response = await fetch(schedulerUrl, {
  method: "POST",
  headers: {
    "x-scheduler-secret": schedulerSecret
  }
});
const body = await response.text();
console.log(`${response.status} ${body}`);

if (!response.ok) {
  process.exit(1);
}
