import { db } from "./lib/firebase.js";
import { collection, getDocs } from "firebase/firestore";

async function checkTeams() {
  const teamsRef = collection(db, "teams");
  const querySnapshot = await getDocs(teamsRef);
  
  console.log("Registered Teams & Coaches:");
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    console.log(`- Team: ${data.name}`);
    console.log(`  Coach: "${data.coachFirstName}" "${data.coachLastName}"`);
    console.log(`  ID: ${doc.id}`);
  });
}

checkTeams().catch(console.error);
