import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  documentId,
  getDoc,
} from 'firebase/firestore';
// import { getAnalytics } from 'firebase/analytics';
import { environment } from '../../../environments/environment.development';
import { SocketService } from '../socket/socket.service';
import { Projects } from '../../../types/app.types';
import { v4 } from 'uuid';

@Injectable({
  providedIn: 'root',
})
export class DbService {
  app;
  store;
  auth;
  storage;
  constructor(private socketService: SocketService) {
    this.app = initializeApp(environment.firebaseConfig);
    this.store = getFirestore(this.app);
    this.auth = getAuth(this.app);
    this.storage = getStorage();
  }

  async createProject() {
    if (!this.auth.currentUser) return;
    try {
      const docRef = await addDoc(collection(this.store, 'projects'), {
        version: '',
        background: '',
        objects: '[]',
        user: this.auth.currentUser?.uid,
        members: [],
      });

      this.socketService.emit('room:join', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error(error);
      return;
    }
  }

  async getProjects() {
    if (!this.auth.currentUser) return;
    const projects: Projects[] = [];
    const q = query(
      collection(this.store, 'projects'),
      where('user', '==', this.auth.currentUser.uid)
    );

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      projects.push({ ...data, id: doc.id } as Projects);
    });
    return projects;
  }

  async getProjectsByIds(ids: string[] | string) {
    if (typeof ids === 'string') {
      ids = [ids];
    }
    try {
      const q = query(
        collection(this.store, 'projects'),
        where(documentId(), 'in', ids)
      );
      const querySnapshot = await getDocs(q);

      const data = await querySnapshot.docs.map((doc) => {
        const fot = doc.data();
        fot['id'] = doc.id;
        return fot;
      });
      return data;
    } catch (error) {
      console.error('Error getting documents:', error);
    }
    return [];
  }

  async updateObjects(objects: string, id: string) {
    try {
      await updateDoc(doc(this.store, 'projects', id), {
        objects,
      });
    } catch (error) {
      console.error(error);
    }
  }
  async uploadImage(img: File) {
    const metadata = {
      contentType: img.type,
    };

    const storageRef = ref(this.storage, 'images/' + v4());
    const uploadTask = uploadBytesResumable(storageRef, img, metadata);
    return await getDownloadURL(uploadTask.snapshot.ref);
  }
}
