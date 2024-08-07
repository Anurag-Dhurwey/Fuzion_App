import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CanvasComponent } from './components/canvas/canvas.component';
import { SignInComponent } from './components/auth/sign-in/sign-in.component';
import { SignUpComponent } from './components/auth/sign-up/sign-up.component';
import { authGuard } from './guard/auth.guard';
import { WelcomeComponent } from './components/welcome/welcome.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { ExperimentalCanvasComponent } from './experimental-canvas/experimental-canvas.component';

export const routes: Routes = [
  { path: 'sign-in', component: SignInComponent ,canActivate:[authGuard]},
  { path: 'sign-up', component: SignUpComponent,canActivate:[authGuard] },
  { path: 'user-profile', component: UserProfileComponent,canActivate:[authGuard] },
  { path: 'dashboard', component: DashboardComponent,canActivate:[authGuard] },
  { path: 'canvas/:id', component: CanvasComponent},
  { path: 'canvas', component: CanvasComponent},
  { path: 'experimaental/canvas', component: ExperimentalCanvasComponent},
  { path: 'canvas/demo/:id', component: CanvasComponent},
  { path: 'welcome', component: WelcomeComponent},
  { path: '', redirectTo: 'welcome', pathMatch: 'full' },
  // { path: '', redirectTo: 'experimaental/canvas', pathMatch: 'full' },
];
