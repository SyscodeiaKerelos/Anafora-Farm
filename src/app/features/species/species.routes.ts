import { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';
import { SpeciesService } from './services/species.service';
import { AddSpeciesPage } from './pages/add-species.page';

export const SPECIES_ROUTES: Routes = [
  {
    path: 'add',
    component: AddSpeciesPage,
    providers: [SpeciesService],
  },
];
