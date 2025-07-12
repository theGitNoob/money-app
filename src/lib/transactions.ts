import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, Timestamp, query, where } from 'firebase/firestore';
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

// Function to get all transactions for a group
export const getGroupTransactions = async (groupId: string): Promise<Transaction[]> => {
  const transactionsCol = collection(db, 'groups', groupId, 'transactions');
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
  await addDoc(transactionsCol, {
    ...transaction,
    createdBy: userId,
    date: Timestamp.fromDate(transaction.date)
  });
};

// Function to add a new transaction for a group
export const addGroupTransaction = async (groupId: string, transaction: Omit<Transaction, 'id'>) => {
  const transactionsCol = collection(db, 'groups', groupId, 'transactions');
  await addDoc(transactionsCol, {
    ...transaction,
    groupId,
    date: Timestamp.fromDate(transaction.date)
  });
};

// Function to update a transaction for a user
export const updateTransaction = async (userId: string, transactionId: string, transaction: Partial<Transaction>) => {
  const transactionRef = doc(db, 'users', userId, 'transactions', transactionId);
  const updateData = { ...transaction } as any;
  if (transaction.date) {
    updateData.date = Timestamp.fromDate(transaction.date);
  }
  await updateDoc(transactionRef, updateData);
};

// Function to update a group transaction
export const updateGroupTransaction = async (groupId: string, transactionId: string, transaction: Partial<Transaction>) => {
  const transactionRef = doc(db, 'groups', groupId, 'transactions', transactionId);
  const updateData = { ...transaction } as any;
  if (transaction.date) {
    updateData.date = Timestamp.fromDate(transaction.date);
  }
  await updateDoc(transactionRef, updateData);
};

// Function to delete a transaction for a user
export const deleteTransaction = async (userId: string, transactionId: string) => {
  const transactionRef = doc(db, 'users', userId, 'transactions', transactionId);
  await deleteDoc(transactionRef);
};

// Function to delete a group transaction
export const deleteGroupTransaction = async (groupId: string, transactionId: string) => {
  const transactionRef = doc(db, 'groups', groupId, 'transactions', transactionId);
  await deleteDoc(transactionRef);
};
