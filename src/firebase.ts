import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, setDoc, collection, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { ExpenseItem } from './types';

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();
export const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
}

export async function logout() {
  await signOut(auth);
}

export async function saveBoardToCloud(userId: string, salaryHistory: Record<string, string>, expenses: ExpenseItem[], fixedExpenses: ExpenseItem[]) {
  const userDocRef = doc(db, 'users', userId);
  
  // Save salary history
  await setDoc(userDocRef, {
    ownerId: userId,
    salaryHistory,
    updatedAt: serverTimestamp()
  }, { merge: true });

  // Save expenses and fixed expenses
  // First clear existing
  const expensesRef = collection(db, 'users', userId, 'expenses');
  const snapshot = await getDocs(expensesRef);
  for (const doc of snapshot.docs) {
    await deleteDoc(doc.ref);
  }

  // Then add new ones
  for (const exp of expenses) {
    await setDoc(doc(db, 'users', userId, 'expenses', exp.id), {
      description: exp.description,
      amount: exp.amount,
      date: exp.date,
      type: 'daily'
    });
  }

  for (const exp of fixedExpenses) {
    await setDoc(doc(db, 'users', userId, 'expenses', exp.id), {
      description: exp.description,
      amount: exp.amount,
      date: exp.date,
      type: 'fixed'
    });
  }
}

export async function loadBoardFromCloud(userId: string) {
  const userDocRef = doc(db, 'users', userId);
  const userDoc = await getDocFromServer(userDocRef);
  
  let salaryHistory: Record<string, string> = {};
  if (userDoc.exists()) {
    salaryHistory = userDoc.data().salaryHistory || {};
  }

  const expensesRef = collection(db, 'users', userId, 'expenses');
  const snapshot = await getDocs(expensesRef);
  
  const dailyExpenses: ExpenseItem[] = [];
  const fixedExpensesList: ExpenseItem[] = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    const item: ExpenseItem = {
      id: doc.id,
      description: data.description,
      amount: data.amount,
      date: data.date
    };
    if (data.type === 'daily') {
      dailyExpenses.push(item);
    } else if (data.type === 'fixed') {
      fixedExpensesList.push(item);
    }
  });

  return { salaryHistory, dailyExpenses, fixedExpensesList };
}
