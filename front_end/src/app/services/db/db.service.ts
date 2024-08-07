import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  listAll,
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
  deleteDoc,
} from 'firebase/firestore';
import { environment } from '../../../../environment';
import { IncludePropertiesOnly, Project } from '../../../types/app.types';
import { v4 } from 'uuid';
import { Observable, of, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
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
  images$: Observable<string[]> = new Observable();
  imageRequestDone: boolean = false;
  constructor(private http: HttpClient) {
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
  async createProject(width: number, height: number) {
    if (!this.auth.currentUser) return;
    try {
      const pro = {
        version: '1.0.0',
        background: '',
        objects: '[]',
        user: this.auth.currentUser?.uid,
        members: [],
        width,
        height,
        name: `project_${Date.now()}`,
      };
      const docRef = await addDoc(collection(this.store, 'projects'), pro);

      this._projects.push({ ...pro, id: docRef.id });
      // this.socketService.emit.room_join(docRef.id);
      return docRef.id;
    } catch (error) {
      console.error(error);
      return;
    }
  }
  async renameProjectById(name: string, id: string) {
    this.updateProject({ name }, id);
  }

  async updateProject(props: Partial<Project>, id: string) {
    try {
      await updateDoc(doc(this.store, 'projects', id), {
        ...props,
      });
      this.client_methods.updateProjectById(props, id);
      // const found = this.projects.find((pr) => pr.id == id) as any;
      // console.log(found);
      // for (const [key, val] of Object.entries(pros)) {
      //   ``;
      //   found[key] = val;
      // }
      return true;
    } catch (error) {
      console.error(error);
      return false;
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
      this.client_methods.setProjects(
        { ...data, id: doc.id } as Project,
        'push'
      );
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

  getMyImages() {
    if (this.imageRequestDone) {
      return;
    }
    if (this.auth.currentUser) {
      const storageRef = ref(
        this.storage,
        `images/${this.auth.currentUser.uid}`
      );
      this.images$ = from(listAll(storageRef)).pipe(
        switchMap((result) => {
          const downloadUrls = result.items.map((item) => getDownloadURL(item));
          return from(Promise.all(downloadUrls)); // Resolve all promises to strings
        }),
        map((downloadUrls) => downloadUrls) // Ensure type safety
      );
      this.imageRequestDone = true;
    } else {
      this.images$ = of([]); // Return an empty array if no user is logged in
    }
    // console.log(this.images$.pipe.length)
  }

  get myImages() {
    return this.images$;
  }

  async updateObjects(objects: string, id: string) {
    try {
      // await updateDoc(doc(this.store, 'projects', id), {
      //   objects,
      // });
      return this.updateProject({ objects }, id);
    } catch (error) {
      console.error(error);
      return false;
    }
  }
  async uploadImage(
    img: File,
    onStateChange: (percent: number) => void,
    onSuccess: (src: string) => void,
    onError: (error: string) => void
  ) {
    if (!this.auth.currentUser) {
      onError('unauthenticated request');
      return;
    }
    if (img.size >= 5 * 1024 * 1024) {
      onError('File size should be less than 5MB');
      return;
    }
    const metadata = {
      contentType: img.type,
    };

    const storageRef = ref(
      this.storage,
      `images/${this.auth.currentUser.uid}/${v4()}`
    );
    const uploadTask = uploadBytesResumable(storageRef, img, metadata);
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onStateChange(progress);
      },
      (error) => {
        // Handle unsuccessful uploads
        console.log(error);
        onError(error.message);
      },
      () => {
        // Handle successful uploads on complete
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          // this.downloadURL = downloadURL;
          console.log({ downloadURL });
          onSuccess(downloadURL);
        });
      }
    );
    // return await getDownloadURL(uploadTask.snapshot.ref);
  }

  async deleteProject(id: string) {
    try {
      await deleteDoc(doc(this.store, 'projects', id));
      this._projects = this.projects.filter((pro) => pro.id != id);
    } catch (error) {}
  }

  client_methods = {
    setProjects: (project: Project | Project[], method: SetProjectsMethods) => {
      if (!Array.isArray(project)) project = [project];
      if (method === 'reset' && Array.isArray(project)) {
        this._projects = project;
      } else if (method === 'push') {
        this._projects = [...this.projects, ...project];
      } else if (method === 'replace') {
        project.forEach((new_pr) => {
          this._projects = this._projects.map((pr) => {
            if (pr.id === new_pr.id) {
              return new_pr;
            }
            return pr;
          });
        });
      }
    },
    updateProjectById: (props: Partial<Project>, id: string) => {
      const found = this.projects.find((pr) => pr.id == id) as any;
      if(!found)return
      for (const [key, val] of Object.entries(props)) {
        found[key] = val;
      }
    },
  };


}

type SetProjectsMethods = 'reset' | 'push' | 'replace';
