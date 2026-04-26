// getToken.js — generates a Firebase ID token for testing
// Usage:  node getToken.js
// Or:     FB_EMAIL=x@y.com FB_PASSWORD=secret node getToken.js

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const readline = require('readline');

const firebaseConfig = {
  apiKey: 'AIzaSyBuYWsjJquuYJaLjE9ycFpEF7luRRxSTBQ',
  authDomain: 'heart2heart-3e3f4.firebaseapp.com',
  projectId: 'heart2heart-3e3f4',
};

initializeApp(firebaseConfig);
const auth = getAuth();

function prompt(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => { rl.close(); resolve(answer.trim()); });
  });
}

async function main() {
  const email    = process.env.FB_EMAIL    || await prompt('Firebase Email: ');
  const password = process.env.FB_PASSWORD || await prompt('Firebase Password: ');

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const token = await cred.user.getIdToken(true);

    console.log('\n✅  UID:', cred.user.uid);
    console.log('\nFIREBASE_TOKEN:', token, '\n');
  } catch (err) {
    console.error('\n❌  Login failed:', err.code, err.message);
    process.exit(1);
  }

  process.exit(0);
}

main();
