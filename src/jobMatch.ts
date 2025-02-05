// First off, I know what kind of data I'm expecting, so let's get it typed out.
// Since we're working with JSON objects coming back, I'm going to create interfaces instead of types:
interface Job {
  title: string;
  location: string;
}

interface Member {
  name: string;
  bio: string;
}

// What I want to return and print is a list of users with their name and whatever their recommended jobs are:
interface Results {
  name: string;
  recommendedJobs: string[];
}

// Now that we've defined the shape of the data coming back to us, I want to get that data:

// fetchJobs should be an async function that returns a promise of an array of jobs
async function fetchJobs(): Promise<Job[]> {
  const response = await fetch("https://bn-hiring-challenge.fly.dev/jobs.json");
  const data = await response.json();
  return data;
}

// Do the same for fetchMembers
async function fetchMembers(): Promise<Member[]> {
  const response = await fetch(
    "https://bn-hiring-challenge.fly.dev/members.json"
  );
  const data = await response.json();
  return data;
}

// To call the functions and have them print to the terminal, I have to wrap them in an async function and await the results:
async function callData() {
  const jobsResult = await fetchJobs();
  const membersResult = await fetchMembers();

  const jobCities = Array.from(
    new Set(jobsResult.map((job) => job.location.toLowerCase()))
  );

  printMatches(jobsResult, membersResult, jobCities);
}

// Once I have the data, pass it to my matching function and then print the results:
function printMatches(jobs, members, cities) {
  const results: Results[] = members.map((member) =>
    matchMembersToJobs(member, jobs, cities)
  );
  console.log(results);
}

// Now I want to start matching the data. There are many ways to do this. I think a simple and quick method to start with
// would be to just break down the bio into keywords, and then match them against the titles and locations. If someone's
// bio contains a keyword in a job title AND location, that should be a match. Worry about Daisy and Hassan and other gotchas later.

// I'm adding a little sanitizeText function to help reduce member bios and job titles down to just key words.
function sanitizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]|_/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

// The big function that does the matching. It takes a member, an array of jobs, and an array of cities,
// then it returns the member's name and an array of recommended jobs.
function matchMembersToJobs(
  member: Member,
  jobs: Job[],
  jobCities: string[]
): Results {
  const matchingJobs: string[] = [];

  const bioKeywords: string[] = sanitizeText(member.bio);
  const bioCities: string[] = bioKeywords.filter((word) =>
    jobCities.includes(word)
  );

  for (const job of jobs) {
    const titleKeywords = sanitizeText(job.title);

    // If the bio mentions any cities that match any job locations, return a locationMatch if the job location also matches.
    // If there isn't any city mentioned in the bio, then still consider it matched.
    const locationMatch: boolean =
      bioCities.length > 0
        ? bioCities.includes(job.location.toLowerCase())
        : true;

    // Using a substring check—if any filtered word in the job title matches any in the bio, it counts.
    const titleMatch: boolean = titleKeywords.some((titleWord) =>
      bioKeywords.some(
        (bioWord) => titleWord.includes(bioWord) || bioWord.includes(titleWord)
      )
    );

    if (titleMatch && locationMatch) {
      matchingJobs.push(`${job.title}, ${job.location}`);
    }
  }

  if (matchingJobs.length === 0) {
    matchingJobs.push("No suitable job found");
  }

  return { name: member.name, recommendedJobs: matchingJobs };
}

// Fire!
callData();
