import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { ChatSession, ChatMessage } from '../types';

export function subscribeToUserSessions(
  userId: string,
  onSessionsUpdate: (sessions: ChatSession[]) => void,
  onError?: (err: any) => void
): () => void {
  const sessionsPath = `users/${userId}/sessions`;
  const q = query(collection(db, sessionsPath), orderBy('updatedAt', 'desc'));

  const unsubscribe = onSnapshot(
    q,
    async (snapshot) => {
      try {
        const sessionList: ChatSession[] = [];

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const sessionId = docSnap.id;

          // Fetch messages subcollection
          const messagesPath = `users/${userId}/sessions/${sessionId}/messages`;
          const msgQuery = query(collection(db, messagesPath), orderBy('timestamp', 'asc'));
          const msgSnap = await getDocs(msgQuery);

          const messages: ChatMessage[] = msgSnap.docs.map((m) => {
            const mData = m.data();
            return {
              id: m.id,
              role: mData.role,
              content: mData.content,
              timestamp: mData.timestamp,
              modelUsed: mData.modelUsed,
              image: mData.image,
              generatedImage: mData.generatedImage,
              groundingSources: mData.groundingSources,
            };
          });

          sessionList.push({
            id: sessionId,
            title: data.title || 'Untitled Session',
            createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
            updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : Date.now(),
            messages,
            model: data.model || 'gemini-3.1-flash-lite',
          });
        }

        onSessionsUpdate(sessionList);
      } catch (err) {
        console.error('Error parsing session snapshot:', err);
        onError?.(err);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, sessionsPath);
    }
  );

  return unsubscribe;
}

export async function saveSessionToFirestore(userId: string, session: ChatSession): Promise<void> {
  const sessionPath = `users/${userId}/sessions/${session.id}`;
  try {
    const sessionRef = doc(db, 'users', userId, 'sessions', session.id);
    const existingSnap = await getDoc(sessionRef);

    if (!existingSnap.exists()) {
      await setDoc(sessionRef, {
        id: session.id,
        userId,
        title: session.title || 'New conversation',
        model: session.model || 'gemini-3.1-flash-lite',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(sessionRef, {
        title: session.title || 'New conversation',
        model: session.model || 'gemini-3.1-flash-lite',
        updatedAt: serverTimestamp(),
      });
    }

    // Save recent messages into messages subcollection
    for (const msg of session.messages) {
      const msgRef = doc(db, 'users', userId, 'sessions', session.id, 'messages', msg.id);
      const msgSnap = await getDoc(msgRef);

      const msgPayload: Record<string, any> = {
        id: msg.id,
        sessionId: session.id,
        userId,
        role: msg.role,
        content: msg.content.slice(0, 50000),
        timestamp: msg.timestamp,
        modelUsed: msg.modelUsed || session.model,
      };
      if (msg.groundingSources && msg.groundingSources.length > 0) {
        msgPayload.groundingSources = msg.groundingSources;
      }

      if (!msgSnap.exists()) {
        await setDoc(msgRef, msgPayload);
      } else {
        await updateDoc(msgRef, {
          content: msg.content.slice(0, 50000),
          modelUsed: msg.modelUsed || session.model,
          ...(msg.groundingSources && msg.groundingSources.length > 0
            ? { groundingSources: msg.groundingSources }
            : {}),
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, sessionPath);
  }
}

export async function deleteSessionFromFirestore(
  userId: string,
  sessionId: string
): Promise<void> {
  const sessionPath = `users/${userId}/sessions/${sessionId}`;
  try {
    const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
    await deleteDoc(sessionRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, sessionPath);
  }
}
