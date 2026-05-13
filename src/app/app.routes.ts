import { Routes } from '@angular/router';
import { MainComponent } from './main/main.component';
import { ProfileComponent } from './user/profile/profile.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { SettingsComponent } from './user/settings/settings.component';
import { CharactersComponent } from './loadout/characters/characters.component';
import { WeaponsComponent } from './loadout/weapons/weapons.component';
import { ItemsComponent } from './loadout/items/items.component';
import { EnemiesComponent } from './loadout/enemies/enemies.component';
import { LoadoutComponent } from './loadout/loadout.component';
import { GameComponent } from './game/game';
import { Buildselector } from './buildselector/buildselector';
import { authGuard } from './auth/auth.guard';
import { publicGuard } from './auth/public.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'main', component: MainComponent, canActivate: [authGuard] },
    { path: 'build-selector', component: Buildselector, canActivate: [authGuard] },
    { path: 'game', component: GameComponent, canActivate: [authGuard] },
    { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
    { path: 'settings', component: SettingsComponent, canActivate: [authGuard] },
    { 
        path: 'loadout', 
        component: LoadoutComponent,
        canActivate: [authGuard],
        children: [
            { path: 'characters', component: CharactersComponent },
            { path: 'weapons', component: WeaponsComponent },
            { path: 'items', component: ItemsComponent },
            { path: 'enemies', component: EnemiesComponent },
            { path: '', redirectTo: 'characters', pathMatch: 'full' }
        ]
    },
    { path: 'login', component: LoginComponent, canActivate: [publicGuard] },
    { path: 'register', component: RegisterComponent, canActivate: [publicGuard] },
    { path: '**', redirectTo: '' }
];


