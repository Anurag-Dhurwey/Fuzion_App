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
import { environment } from '../../../../environment';
// front_end/environment.ts
import { SocketService } from '../socket/socket.service';
import { Project } from '../../../types/app.types';
import { v4 } from 'uuid';
import { CanvasService } from '../canvas/canvas.service';

@Injectable({
  providedIn: 'root',
})
export class DbService {
  app;
  store;
  auth;
  storage;
  constructor(
    private socketService: SocketService,
    private canvasService: CanvasService
  ) {
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
        width: window.innerWidth,
        height: window.innerHeight,
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
    const projects: Project[] = [];
    const q = query(
      collection(this.store, 'projects'),
      where('user', '==', this.auth.currentUser.uid)
    );

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      projects.push({ ...data, id: doc.id } as Project);
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
