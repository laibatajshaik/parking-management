import { signOut } from "firebase/auth";
import { auth } from "../components/firebase.js";

export async function logoutCurrentUser() {
  try {
    await signOut(auth);
  } finally {
    localStorage.removeItem("shnoor_current_user");
    localStorage.removeItem("shnoor_auth_state");
  }
}
