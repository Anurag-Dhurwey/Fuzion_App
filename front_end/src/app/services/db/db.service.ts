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
  deleteDoc,
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
  private _projects: Project[] = [];
  private _promotional_projects: Project[] = [];
  constructor(
    private socketService: SocketService,
    private canvasService: CanvasService
  ) {
    this.app = initializeApp(environment.firebaseConfig);
    this.store = getFirestore(this.app);
    this.auth = getAuth(this.app);
    this.storage = getStorage();
  }
  get projects() {
    return this._projects;
  }
  get promotional_projects() {
    return this._promotional_projects;
  }
  async createProject() {
    if (!this.auth.currentUser) return;
    try {
      const pro = {
        version: '1.0.0',
        background: '',
        objects: '[]',
        user: this.auth.currentUser?.uid,
        members: [],
        width: this.canvasService.frame.x,
        height: this.canvasService.frame.y,
      };
      const docRef = await addDoc(collection(this.store, 'projects'), pro);

      this._projects.push({ ...pro, id: docRef.id });
      this.socketService.emit.room_join(docRef.id);
      return docRef.id;
    } catch (error) {
      console.error(error);
      return;
    }
  }
  async togglePromotional(pro: Project) {
    try {
      await updateDoc(doc(this.store, 'projects', pro.id), {
        promotional: !pro.promotional,
      });
      pro.promotional = !pro.promotional;
      if (!pro.promotional) {
        this._promotional_projects = this.promotional_projects.filter(
          (obj) => obj.id != pro.id
        );
      } else {
        this._promotional_projects.push(pro);
      }
    } catch (error) {
      console.error(error);
    }
  }
  async getProjects() {
    if (!this.auth.currentUser || this.projects.length) return this.projects;
    // const projects: Project[] = [];
    const q = query(
      collection(this.store, 'projects'),
      where('user', '==', this.auth.currentUser.uid)
    );

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      this.setProjects({ ...data, id: doc.id } as Project, 'push');
    });
    // this.projects=projects
    return this.projects;
  }
  async getPromotional_projects() {
    if (
      !this.promotional_projects.length &&
      environment.promotional_projects_ids.length
    ) {
      this._promotional_projects = (await this.getProjectsByIds(
        environment.promotional_projects_ids
      )) as Project[];
    }
    return this.promotional_projects;
  }
  async getProjectsByIds(ids: string[] | string) {
    if (typeof ids === 'string') {
      ids = [ids];
    }

    const res: Project[] = [];
    for (const id of ids) {
      const found = this.projects.find((pro) => pro.id === id);
      if (found) {
        res.push(found);
        ids = ids.filter((i) => i !== id);
      } else {
        const found = this.promotional_projects.find((pro) => pro.id === id);
        if (found) {
          res.push(found);
          ids = ids.filter((i) => i !== id);
        }
      }
    }

    if (!ids.length) {
      return res;
    }

    try {
      const q = query(
        collection(this.store, 'projects'),
        where(documentId(), 'in', ids)
      );
      const querySnapshot = await getDocs(q);

      await querySnapshot.docs.forEach((doc) => {
        const fot = doc.data() as Project;
        fot['id'] = doc.id;
        res.push(fot);
      });
    } catch (error) {
      console.error('Error getting documents:', error);
    }
    return res;
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

  setProjects(
    project: Project | Project[],
    method: 'reset' | 'push' | 'replace'
  ) {
    if (!Array.isArray(project)) project = [project];
    if (method === 'reset' && Array.isArray(project)) {
      this._projects = project;
    } else if (method === 'push') {
      this._projects = [...this.projects, ...project];
    } else if (method === 'replace') {
      this._projects = this.projects.map((pro) => {
        for (const its of project as Project[]) {
          if (its.id == pro.id) return its;
        }
        return pro;
      });
    }
  }

  async deleteProject(id: string) {
    try {
      await deleteDoc(doc(this.store, 'projects', id));
      this._projects = this.projects.filter((pro) => pro.id != id);
    } catch (error) {}
  }
}
