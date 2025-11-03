import { createClient } from "@supabase/supabase-js";

const supabase = createClient("https://hqykerdvijsyhfhlsmmo.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxeWtlcmR2aWpzeWhmaGxzbW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNTkwMjYsImV4cCI6MjA3NjgzNTAyNn0.pwaNh1Z41akXkfRoFLgtPvkrAW0pIFra9UQjYFSC3hU");

const rewardedWallets = [
  'J4iQt9AS4QFoXzsij6pTwCUyrkS1JVNUpnRqh9FdTU3Y',
  'gznW4rYjG5qfHSa93vdXiyNMDWex6dyei9h68VdPzJv',
  '215nhcAHjQQGgwpQSJQ7zR26etbjjtVdW74NLzwEgQjP',
  'EtaEri9SPJcy3JmUAyRVNeaqP4CLECKPW8FfPi5TXm4b',
  '2fg5QD1eD7rzNNCsvnhmXFm5hqNgwTTG8p7kQ6f3rx6f',
  'EaVboaPxFCYanjoNWdkxTbPvt57nhXGu5i6m9m6ZS2kK',
  'AGqjivJr1dSv73TVUvdtqAwogzmThzvYMVXjGWg2FYLm',
  'J9mnzdvz2yd3gPMq5pwNtcYPchHpKJaafEaAcksVc9Kf',
  'Cv9d9yYD9G49Rwo3cLc3kLyGo9ZeBnR7p7QdGd6yaTxc',
  '77n6X7LtGy5AZprsvjZu1eaekJpxqLeVRZLPJZdBYyg9',
  '8FUmdjqsbS2HAiYBg6yJwwT2BNZfAKa5P2GuHYcPFNXZ',
  'CZRZzgaqS6xWf3GU9ckvnrZxA5J2qGzj55YffN4KWxEw',
  'AmWHnqnfqyjTq6oymry2YT1UQAzBK5y6gH4Q5FZMfGFb',
  'A4DCAjDwkq5jYhNoZ5Xn2NbkTLimARkerVv81w2dhXgL'
]

async function main() {
  const { data, error } = await supabase
  .from("rewards")
    .delete()
    .in("wallet_address", rewardedWallets) // 🟢 deletes all matching wallet addresses
    .select("id");

  if (error) {
    console.error("Failed to delete daily leaderboard rewards:", error);
    process.exit(1);
  }

  console.log(
    `Deleted ${Array.isArray(data) ? data.length : 0} daily leaderboard reward entries.`
  );
}

main().then(
  () => {
    process.exit(0);
  },
  (error) => {
    console.error("Unexpected failure while clearing daily leaderboard rewards:", error);
    process.exit(1);
  }
);
