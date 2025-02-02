import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';
import 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyCbQ8iRO-ydbUBATcq7Ej5L4TDEptqjgAU",
  authDomain: "superchat-22eaa.firebaseapp.com",
  databaseURL: "https://superchat-22eaa-default-rtdb.firebaseio.com",
  projectId: "superchat-22eaa",
  storageBucket: "superchat-22eaa.appspot.com",
  messagingSenderId: "619162059122",
  appId: "1:619162059122:web:5280d9512f56bc16089deb",
  measurementId: "G-6XKVE61VN3"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export default firebase;
export const auth = firebase.auth();
export const firestore = firebase.firestore();
export const messaging = firebase.messaging();

export const requestNotificationPermission = async () => {
  try {
    await messaging.requestPermission();
    const token = await messaging.getToken();
    return token;
  } catch (error) {
    console.error('Error getting permission', error);
    return null;
  }
};

export const createServer = async (name: string, ownerId: string) => {
  try {
    const serverRef = await firestore.collection('servers').add({
      name,
      ownerId,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      members: [ownerId],
    });

    await firestore.collection('channels').add({
      serverId: serverRef.id,
      name: 'general',
      type: 'text',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    return serverRef.id;
  } catch (error) {
    console.error('Error creating server:', error);
    throw error;
  }
};

export const joinServer = async (serverId: string, userId: string) => {
  try {
    await firestore.collection('servers').doc(serverId).update({
      members: firebase.firestore.FieldValue.arrayUnion(userId),
    });
  } catch (error) {
    console.error('Error joining server:', error);
    throw error;
  }
};

export const createChannel = async (serverId: string, name: string, type: 'text' | 'voice') => {
  try {
    await firestore.collection('channels').add({
      serverId,
      name,
      type,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating channel:', error);
    throw error;
  }
};