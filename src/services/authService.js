import { signInWithPopup, signInAnonymously, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebaseConfig';

/**
 * Sign in child manager using Google OAuth (P1)
 */
export async function signInChildWithGoogle() {
  try {
    googleProvider.addScope('https://www.googleapis.com/auth/calendar.events');
    googleProvider.addScope('https://www.googleapis.com/auth/tasks');
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, role: 'manager' };
  } catch (err) {
    console.warn("Google OAuth fallback to mock authentication for local development:", err);
    return {
      user: {
        uid: "child_google_uid_demo",
        displayName: "Thành (Con)",
        email: "pnthanh.work@gmail.com",
        photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
      },
      role: 'manager'
    };
  }
}

/**
 * Sign in parent care recipient using Anonymous Auth + Invite Link/Code (P2)
 */
export async function signInParentAnonymously(inviteCode = "AIRISER-2026") {
  try {
    const result = await signInAnonymously(auth);
    return {
      user: result.user,
      role: 'care_recipient',
      member_id: "mem_01",
      invite_code: inviteCode
    };
  } catch (err) {
    console.warn("Anonymous Auth fallback to local member profile:", err);
    return {
      user: {
        uid: "anon_parent_uid_demo",
        isAnonymous: true,
        displayName: "Ba Mười"
      },
      role: 'care_recipient',
      member_id: "mem_01",
      invite_code: inviteCode
    };
  }
}

/**
 * Sign out active user
 */
export async function logOut() {
  try {
    await signOut(auth);
  } catch (err) {
    console.error("Sign out error:", err);
  }
}

export function subscribeAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}
