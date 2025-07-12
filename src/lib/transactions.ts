import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { Transaction } from './types';

// Function to get all transactions for a user
export const getTransactions = async (userId: string): Promise<Transaction[]> => {
  const transactionsCol = collection(db, 'users', userId, 'transactions');
  const transactionSnapshot = await getDocs(transactionsCol);
  const transactionList = transactionSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: (data.date as Timestamp).toDate(),
    } as Transaction;
  });
  return transactionList;
};

// Function to add a new transaction for a user
export const addTransaction = async (userId: string, transaction: Omit<Transaction, 'id'>) => {
  const transactionsCol = collection(db, 'users', userId, 'transactions');
  await addDoc(transactionsCol, transaction);
};

// Function to update a transaction for a user
export const updateTransaction = async (userId: string, transactionId: string, transaction: Partial<Transaction>) => {
  const transactionRef = doc(db, 'users', userId, 'transactions', transactionId);
  await updateDoc(transactionRef, transaction);
};

// Function to delete a transaction for a user
export const deleteTransaction = async (userId: string, transactionId: string) => {
  const transactionRef = doc(db, 'users', userId, 'transactions', transactionId);
  await deleteDoc(transactionRef);
};
