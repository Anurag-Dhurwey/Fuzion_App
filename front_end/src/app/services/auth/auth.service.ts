import { Injectable } from '@angular/core';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import { Router } from '@angular/router';
import { DbService } from '../db/db.service';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private router: Router, private dbService: DbService) {}
  auth = getAuth(this.dbService.app);

  async signUp(email: string, pass: string) {
    await createUserWithEmailAndPassword(this.auth, email, pass);
  }

  async signIn(email: string, pass: string) {
    await signInWithEmailAndPassword(this.auth, email, pass);
  }

  whenAuthStateChange(cb: (user: User | null) => void) {
    onAuthStateChanged(this.auth, (user) => {
      cb(user);
    });
  }

  async signOutUser() {
    await signOut(this.auth);
  }
}
