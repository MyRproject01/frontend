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

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'main', component: MainComponent },
    { path: 'build-selector', component: Buildselector },
    { path: 'game', component: GameComponent },
    { path: 'profile', component: ProfileComponent },
    { path: 'settings', component: SettingsComponent },
    { 
        path: 'loadout', 
        component: LoadoutComponent,
        children: [
            { path: 'characters', component: CharactersComponent },
            { path: 'weapons', component: WeaponsComponent },
            { path: 'items', component: ItemsComponent },
            { path: 'enemies', component: EnemiesComponent },
            { path: '', redirectTo: 'characters', pathMatch: 'full' }
        ]
    },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: '**', redirectTo: '' }
];
